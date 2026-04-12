import {
  createEmptyNormalizedFeedbackForm,
  formatNormalizedFieldValue,
  pageExtractionSchema,
  rawPageExtractionSchema,
  sanitizeMissingFieldKeys,
  type NormalizedFeedbackForm,
  type PageAnswerType,
  type PageExtraction,
  type RawPageExtraction,
} from "@/lib/gti/schema";
import {
  finalizeNormalizedFeedbackForm,
  isSingleSelectField,
  normalizeMultiSelectFieldValue,
  normalizeSingleSelectFieldValue,
} from "@/lib/gti/finalize";
import { normalizeGtiFreeTextField } from "@/lib/gti/normalize-text";
import { GTI_EXPECTED_PAGE_COUNT, GTI_PAGE_CONFIGS } from "@/lib/gti/page-map";
import {
  GTI_FIELD_DEFINITIONS,
  gtiExtractedFieldKeys,
  gtiFieldLabels,
  type GtiExtractedFieldKey,
} from "@/lib/gti/template";

type NormalizeGtiDocumentArgs = {
  fileName: string;
  pageResults: RawPageExtraction[];
  pageCount: number;
};

const FIELD_KEY_SET = new Set<GtiExtractedFieldKey>(gtiExtractedFieldKeys);

export function normalizeGtiDocument({
  fileName,
  pageResults,
  pageCount,
}: NormalizeGtiDocumentArgs) {
  const validatedPages = pageResults.map((page) => rawPageExtractionSchema.parse(page));
  const normalized = createEmptyNormalizedFeedbackForm(fileName);
  const pageExtractions: PageExtraction[] = [];
  const confidenceNotes: string[] = [];
  const missingFieldKeys = new Set<GtiExtractedFieldKey>();
  const capturedPages = new Set(validatedPages.map((page) => page.pageNumber));

  for (const pageConfig of GTI_PAGE_CONFIGS) {
    const pageResult = validatedPages.find(
      (candidate) => candidate.pageNumber === pageConfig.pageNumber,
    );

    if (!pageResult) {
      confidenceNotes.push(
        `Page ${pageConfig.pageNumber} was not available for extraction.`,
      );
      pageConfig.fieldKeys.forEach((fieldKey) => {
        missingFieldKeys.add(fieldKey);
      });
      continue;
    }

    const transformedPage = transformPageResult(pageResult);
    pageExtractions.push(transformedPage);
    confidenceNotes.push(...transformedPage.confidenceNotes);
    transformedPage.missingOrUnclearFields.forEach((fieldKey) => {
      if (FIELD_KEY_SET.has(fieldKey as GtiExtractedFieldKey)) {
        missingFieldKeys.add(fieldKey as GtiExtractedFieldKey);
      }
    });

    for (const fieldKey of pageConfig.fieldKeys) {
      const rawField = pageResult.fields[fieldKey];
      const sanitized = sanitizeFieldValue(fieldKey, rawField);
      applySanitizedField(normalized, fieldKey, sanitized.value);

      if (sanitized.note) {
        confidenceNotes.push(sanitized.note);
      }

      if (sanitized.needsReview) {
        missingFieldKeys.add(fieldKey);
      }
    }
  }

  const unexpectedPages = validatedPages
    .filter((page) => page.pageNumber > GTI_EXPECTED_PAGE_COUNT)
    .map((page) => page.pageNumber);

  if (unexpectedPages.length > 0) {
    confidenceNotes.push(
      `Ignored unexpected extra page${unexpectedPages.length === 1 ? "" : "s"}: ${unexpectedPages.join(", ")}.`,
    );
  }

  if (pageCount < GTI_EXPECTED_PAGE_COUNT) {
    confidenceNotes.push(
      `Only ${pageCount} of ${GTI_EXPECTED_PAGE_COUNT} expected GTI form pages were provided.`,
    );
  }

  normalized.confidenceNotes = uniqueStrings(confidenceNotes);
  normalized.missingOrUnclearFields = [...missingFieldKeys].sort();

  const finalized = finalizeNormalizedFeedbackForm(normalized);

  return {
    normalized: finalized,
    pageExtractions: pageExtractions.map((page) => pageExtractionSchema.parse(page)),
    combinedTranscription: buildCombinedTranscription(pageExtractions),
    missingPageCount: GTI_EXPECTED_PAGE_COUNT - capturedPages.size,
  };
}

function transformPageResult(pageResult: RawPageExtraction): PageExtraction {
  const pageConfidenceNotes = uniqueStrings(pageResult.confidenceNotes.map(cleanNote));
  const pageMissingFields = new Set<GtiExtractedFieldKey>(
    sanitizeMissingFieldKeys(pageResult.missingOrUnclearFields),
  );

  const extractedItems = Object.entries(pageResult.fields)
    .filter(([fieldKey]) => FIELD_KEY_SET.has(fieldKey as GtiExtractedFieldKey))
    .map(([fieldKey, rawField]) => {
      const typedFieldKey = fieldKey as GtiExtractedFieldKey;
      const sanitized = sanitizeFieldValue(typedFieldKey, rawField);

      if (sanitized.note) {
        pageConfidenceNotes.push(sanitized.note);
      }

      if (sanitized.needsReview) {
        pageMissingFields.add(typedFieldKey);
      }

      return {
        fieldKey: typedFieldKey,
        label: gtiFieldLabels[typedFieldKey],
        answer: formatValueForDisplay(sanitized.value),
        answerType: resolveAnswerType(typedFieldKey),
        selectedOptions: resolveSelectedOptions(typedFieldKey, sanitized.value),
        evidence: cleanText(rawField.evidence),
        isBlank: sanitized.isBlank,
        uncertainty: cleanText(rawField.uncertainty),
      };
    });

  return {
    pageNumber: pageResult.pageNumber,
    sectionTitle: cleanText(pageResult.sectionTitle),
    pageSummary:
      cleanText(pageResult.pageSummary) ||
      `GTI template page ${pageResult.pageNumber} extracted.`,
    transcribedText: cleanText(pageResult.transcribedText),
    extractedItems,
    confidenceNotes: uniqueStrings(pageConfidenceNotes),
    missingOrUnclearFields: [...pageMissingFields].sort(),
  };
}

function sanitizeFieldValue(
  fieldKey: GtiExtractedFieldKey,
  rawField: RawPageExtraction["fields"][string] | undefined,
) {
  const field = GTI_FIELD_DEFINITIONS[fieldKey];
  const source = rawField ?? {
    value: "",
    selectedValues: [],
    evidence: "",
    reasoning: "",
    confidence: "low",
    isBlank: true,
    uncertainty: "No extraction data returned for this field.",
  };
  const baseUncertainty = cleanText(source.uncertainty);

  if (field.type === "free_text") {
    const rawValue = normalizeGtiFreeTextField(
      fieldKey as "cityAreaName" | "brandSmokedMostOften" | "likedMost" | "shouldImprove",
      normalizeFreeTextValue(source.value),
    );
    const echoDetected = looksLikeQuestionEcho(fieldKey, rawValue);
    const value = echoDetected ? "" : rawValue;
    const reviewReason = resolveReviewReason({
      fieldKey,
      source,
      fallbackReason: echoDetected
        ? "Printed question text was returned instead of the answer."
        : "",
      hasValue: value.length > 0,
    });

    return {
      value,
      isBlank: source.isBlank || value.length === 0,
      needsReview: Boolean(reviewReason),
      note: buildFieldNote(fieldKey, reviewReason || baseUncertainty),
    };
  }

  if (field.type === "multi_select_max_2") {
    const selectedValues = normalizeMultiSelectFieldValue([
      source.selectedValues,
      source.value,
    ]);
    const reviewReason = resolveReviewReason({
      fieldKey,
      source,
      fallbackReason:
        selectedValues.length === 0 && source.selectedValues.length > 1
          ? "Multiple marks were detected for this field, but a clean top-2 selection could not be confirmed."
          : "",
      hasValue: selectedValues.length > 0,
    });

    return {
      value: selectedValues,
      isBlank: source.isBlank || selectedValues.length === 0,
      needsReview: Boolean(reviewReason),
      note: buildFieldNote(fieldKey, reviewReason || baseUncertainty),
    };
  }

  const singleSelectResult = isSingleSelectField(fieldKey)
    ? normalizeSingleSelectFieldValue(fieldKey, [source.selectedValues, source.value])
    : { value: "", ambiguous: false };
  const reviewReason = resolveReviewReason({
    fieldKey,
    source,
    fallbackReason: singleSelectResult.ambiguous
      ? "Multiple answers were detected for a single-select field."
      : "",
    hasValue: singleSelectResult.value.length > 0,
  });

  return {
    value: singleSelectResult.value,
    isBlank: source.isBlank || singleSelectResult.value.length === 0,
    needsReview: Boolean(reviewReason),
    note: buildFieldNote(fieldKey, reviewReason || baseUncertainty),
  };
}

function applySanitizedField(
  normalized: NormalizedFeedbackForm,
  fieldKey: GtiExtractedFieldKey,
  value: string | string[],
) {
  if (fieldKey === "mainReasonForRating") {
    normalized.mainReasonForRating = Array.isArray(value)
      ? (value as NormalizedFeedbackForm["mainReasonForRating"])
      : [];
    return;
  }

  const scalarValue = Array.isArray(value) ? formatValueForDisplay(value) : value;
  (normalized as Record<GtiExtractedFieldKey, string | string[]>)[fieldKey] =
    scalarValue;
}

function resolveAnswerType(fieldKey: GtiExtractedFieldKey): PageAnswerType {
  const fieldType = GTI_FIELD_DEFINITIONS[fieldKey].type;

  if (fieldKey === "brandSmokedMostOften") {
    return "brand";
  }

  if (fieldType === "free_text") {
    return fieldKey === "likedMost" || fieldKey === "shouldImprove" ? "comment" : "text";
  }

  if (fieldType === "scale_1_to_5" || fieldType === "scale_1_to_3") {
    return "rating";
  }

  if (fieldType === "multi_select_max_2") {
    return "choice";
  }

  return "choice";
}

function buildCombinedTranscription(pageExtractions: PageExtraction[]) {
  return pageExtractions
    .map((page) =>
      [
        `Page ${page.pageNumber}`,
        page.sectionTitle ? `Section: ${page.sectionTitle}` : "",
        page.transcribedText,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}

function buildFieldNote(fieldKey: GtiExtractedFieldKey, note: string) {
  if (!note) {
    return "";
  }

  return `${gtiFieldLabels[fieldKey]}: ${note}`;
}

function resolveReviewReason({
  fieldKey,
  source,
  fallbackReason,
  hasValue,
}: {
  fieldKey: GtiExtractedFieldKey;
  source: NonNullable<RawPageExtraction["fields"][string]>;
  fallbackReason?: string;
  hasValue: boolean;
}) {
  const uncertainty = cleanText(source.uncertainty);

  if (fallbackReason) {
    return fallbackReason;
  }

  if (uncertainty) {
    return uncertainty;
  }

  if (!hasValue && !source.isBlank) {
    return "No valid answer could be resolved from the visible marks.";
  }

  if (source.confidence === "low" && hasValue) {
    return "Low-confidence answer. Review suggested.";
  }

  if (source.confidence === "medium" && looksLikeQuestionEcho(fieldKey, source.value)) {
    return "Returned text resembles the printed question instead of the answer.";
  }

  return "";
}

function cleanText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function cleanNote(value: string) {
  return cleanText(value).replace(/\s+/g, " ");
}

function normalizeFreeTextValue(value: string) {
  return cleanText(value)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function looksLikeQuestionEcho(fieldKey: GtiExtractedFieldKey, value: string) {
  const token = normalizeQuestionToken(value);

  if (!token) {
    return false;
  }

  const field = GTI_FIELD_DEFINITIONS[fieldKey];
  const labelToken = normalizeQuestionToken(field.label);
  const questionToken = normalizeQuestionToken(field.question);

  return (
    token === labelToken ||
    token === questionToken ||
    labelToken.includes(token) ||
    questionToken.includes(token)
  );
}

function normalizeQuestionToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function formatValueForDisplay(value: string | string[]) {
  return Array.isArray(value) ? formatNormalizedFieldValue(value, ", ") : value;
}

function resolveSelectedOptions(
  fieldKey: GtiExtractedFieldKey,
  value: string | string[],
) {
  const fieldType = GTI_FIELD_DEFINITIONS[fieldKey].type;

  if (fieldType === "free_text") {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}
