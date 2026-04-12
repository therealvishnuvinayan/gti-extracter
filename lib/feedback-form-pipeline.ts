import "server-only";

import { extractFieldGroupFromPage, extractSingleFieldFromPage } from "@/lib/gti/extract-field";
import { normalizeGtiDocument } from "@/lib/gti/normalize";
import { getFieldGroupsForPage, getTemplateField } from "@/lib/gti/template-fields";
import {
  fieldConfidenceSchema,
  rawPageExtractionSchema,
  rawPageFieldValueSchema,
  type ExtractionDebugTrace,
  type RawPageExtraction,
  type RawPageFieldValue,
} from "@/lib/gti/schema";
import { GTI_EXPECTED_PAGE_COUNT, getGtiPageConfig } from "@/lib/gti/page-map";
import { type GtiExtractedFieldKey } from "@/lib/gti/template";
import { renderPdfToPngPages } from "@/lib/pdf";
import {
  createEmptyNormalizedFeedbackForm,
  extractionBatchResultSchema,
  hasAnyNormalizedFeedbackValue,
  normalizedFeedbackScalarFieldKeys,
  processedFeedbackDocumentSchema,
  type ExtractionBatchResult,
  type NormalizedFeedbackForm,
  type PageExtraction,
  type ProcessedFeedbackDocument,
} from "@/lib/types";

export type SupportedSourceFile = {
  fileName: string;
  mimeType: string;
  bytes: Buffer;
};

type RenderedSourcePage = {
  pageNumber: number;
  mimeType: string;
  bytes: Buffer;
};

type ExtractFeedbackOptions = {
  debug?: boolean;
};

export async function extractFeedbackForms(
  files: SupportedSourceFile[],
  options: ExtractFeedbackOptions = {},
): Promise<ExtractionBatchResult> {
  const documents: ProcessedFeedbackDocument[] = [];
  let totalPages = 0;

  for (const file of files) {
    const document = await extractSingleFeedbackFile(file, options);
    documents.push(document);
    totalPages += document.pageCount;
  }

  return extractionBatchResultSchema.parse({
    documents,
    summary: {
      totalFiles: documents.length,
      completedFiles: documents.filter((document) => document.status === "completed")
        .length,
      failedFiles: documents.filter((document) => document.status === "failed").length,
      totalPages,
    },
  });
}

export async function extractSingleFeedbackFile(
  {
    bytes,
    fileName,
    mimeType,
  }: SupportedSourceFile,
  options: ExtractFeedbackOptions,
): Promise<ProcessedFeedbackDocument> {
  const sourceKind = mimeType === "application/pdf" ? "pdf" : "image";
  let renderedPages: RenderedSourcePage[] = [];
  const rawPageResults: RawPageExtraction[] = [];
  const debugTraces: ExtractionDebugTrace[] = [];
  let failedPageCount = 0;
  const documentNotes: string[] = [];

  try {
    renderedPages =
      sourceKind === "pdf"
        ? await renderPdfToPageImages(bytes)
        : [
            {
              pageNumber: 1,
              mimeType,
              bytes,
            },
          ];

    for (const page of renderedPages) {
      const pageConfig = getGtiPageConfig(page.pageNumber);

      if (!pageConfig) {
        documentNotes.push(`Ignored unexpected extra page ${page.pageNumber}.`);
        continue;
      }

      try {
        const pageResult = await extractSinglePage({
          fileName,
          totalPages: renderedPages.length,
          page,
          debug: options.debug === true,
        });
        rawPageResults.push(pageResult.pageResult);
        debugTraces.push(...pageResult.debugTraces);
      } catch (error) {
        failedPageCount += 1;
        rawPageResults.push(
          buildBlankRawPageResult({
            pageNumber: page.pageNumber,
            message: toExtractionErrorMessage(error),
          }),
        );
      }
    }

    const normalizedResult = normalizeGtiDocument({
      fileName,
      pageResults: rawPageResults,
      pageCount: renderedPages.length,
    });
    const normalized = {
      ...normalizedResult.normalized,
      confidenceNotes: uniqueStrings([
        ...normalizedResult.normalized.confidenceNotes,
        ...documentNotes,
      ]),
    };
    const status = isDocumentReliable({
      failedPageCount,
      normalized,
      pageCount: renderedPages.length,
    })
      ? "completed"
      : "failed";

    return processedFeedbackDocumentSchema.parse({
      sourceFileName: fileName,
      sourceMimeType: mimeType,
      sourceKind,
      pageCount: renderedPages.length,
      status,
      normalized,
      pageExtractions: normalizedResult.pageExtractions,
      combinedTranscription: normalizedResult.combinedTranscription,
      errorMessage:
        status === "completed"
          ? ""
          : buildFailureMessage({
              pageCount: renderedPages.length,
              failedPageCount,
              normalized,
            }),
      ...(options.debug ? { debug: { fieldTraces: debugTraces } } : {}),
    });
  } catch (error) {
    return buildFailedProcessedDocument({
      fileName,
      mimeType,
      sourceKind,
      pageCount: renderedPages.length || rawPageResults.length,
      pageExtractions: rawPageResults
        .map(transformRawPageResultSafely)
        .filter((page): page is PageExtraction => Boolean(page)),
      message: toExtractionErrorMessage(error),
      debugTraces,
      includeDebug: options.debug === true,
    });
  }
}

async function renderPdfToPageImages(bytes: Buffer) {
  try {
    return await renderPdfToPngPages(bytes);
  } catch (error) {
    throw new FeedbackExtractionError(
      "PDF_RENDER_ERROR",
      error instanceof Error
        ? error.message
        : "The PDF could not be rasterized into page images.",
    );
  }
}

async function extractSinglePage({
  fileName,
  totalPages,
  page,
  debug,
}: {
  fileName: string;
  totalPages: number;
  page: RenderedSourcePage;
  debug: boolean;
}) {
  const pageConfig = getGtiPageConfig(page.pageNumber);

  if (!pageConfig) {
    throw new FeedbackExtractionError(
      "UNCLEAR_DOCUMENT",
      `Page ${page.pageNumber} does not match the expected GTI page map.`,
    );
  }

  const pageGroups = getFieldGroupsForPage(page.pageNumber);
  const pageFields = new Map<GtiExtractedFieldKey, RawPageFieldValue>();
  const pageNotes: string[] = [];
  const debugTraces: ExtractionDebugTrace[] = [];
  const groupResults = await mapWithConcurrency(pageGroups, 2, async (group) => {
    try {
      return {
        group,
        result: await extractFieldGroupFromPage({
          fileName,
          totalPages,
          page,
          group,
        }),
      } as const;
    } catch (error) {
      const message = toExtractionErrorMessage(error);
      const fallbackResults = await mapWithConcurrency(group.fieldKeys, 2, async (fieldKey) => {
        try {
          return await extractSingleFieldFromPage({
            fileName,
            totalPages,
            page,
            fieldKey,
          });
        } catch (singleFieldError) {
          return {
            groupId: `field_${fieldKey}`,
            pageNumber: page.pageNumber,
            notes: [`${getTemplateField(fieldKey).label}: ${toExtractionErrorMessage(singleFieldError)}`],
            fields: {
              [fieldKey]: buildBlankRawFieldValue(
                toExtractionErrorMessage(singleFieldError),
              ),
            } as Record<GtiExtractedFieldKey, RawPageFieldValue>,
            debugTraces: [],
          };
        }
      });

      return {
        group,
        errorMessage: message,
        fallbackResults,
      } as const;
    }
  });

  for (const groupResult of groupResults) {
    if ("result" in groupResult && groupResult.result) {
      groupResult.result.notes.forEach((note) => pageNotes.push(note));
      groupResult.result.debugTraces.forEach((trace) => debugTraces.push(trace));

      for (const fieldKey of groupResult.group.fieldKeys) {
        pageFields.set(fieldKey, groupResult.result.fields[fieldKey]);
      }

      continue;
    }

    pageNotes.push(`${groupResult.group.label}: ${groupResult.errorMessage}`);

    for (const fallback of groupResult.fallbackResults) {
      fallback.notes.forEach((note) => pageNotes.push(note));
      fallback.debugTraces.forEach((trace) => debugTraces.push(trace));

      for (const fieldKey of Object.keys(fallback.fields) as GtiExtractedFieldKey[]) {
        pageFields.set(fieldKey, fallback.fields[fieldKey]);
      }
    }
  }

  const fallbackFieldKeys = pageGroups.flatMap((group) =>
    group.fieldKeys.filter((fieldKey) =>
      shouldRunFieldFallback(fieldKey, pageFields.get(fieldKey)),
    ),
  );
  const uniqueFallbackFieldKeys = [...new Set(fallbackFieldKeys)];

  const fallbackResults = await mapWithConcurrency(
    uniqueFallbackFieldKeys,
    2,
    async (fieldKey) => {
      try {
        return {
          fieldKey,
          result: await extractSingleFieldFromPage({
            fileName,
            totalPages,
            page,
            fieldKey,
          }),
        } as const;
      } catch (error) {
        return {
          fieldKey,
          errorMessage: toExtractionErrorMessage(error),
        } as const;
      }
    },
  );

  for (const fallbackResult of fallbackResults) {
    if ("result" in fallbackResult && fallbackResult.result) {
      const primary = pageFields.get(fallbackResult.fieldKey);
      const fallbackField = fallbackResult.result.fields[fallbackResult.fieldKey];

      if (shouldReplaceFieldResult(fallbackResult.fieldKey, primary, fallbackField)) {
        pageFields.set(fallbackResult.fieldKey, fallbackField);
      }

      fallbackResult.result.notes.forEach((note) => pageNotes.push(note));
      fallbackResult.result.debugTraces.forEach((trace) => debugTraces.push(trace));
      continue;
    }

    pageNotes.push(
      `${getTemplateField(fallbackResult.fieldKey).label}: ${fallbackResult.errorMessage}`,
    );
  }

  const fields = Object.fromEntries(
    pageConfig.fieldKeys.map((fieldKey) => [
      fieldKey,
      pageFields.get(fieldKey) ?? buildBlankRawFieldValue("No extraction data returned for this field."),
    ]),
  );
  const missingOrUnclearFields = pageConfig.fieldKeys.filter((fieldKey) =>
    shouldFlagFieldForReview(fields[fieldKey]),
  );
  const transcribedText = buildPageTranscription(pageConfig.fieldKeys, fields);
  const filledCount = pageConfig.fieldKeys.filter((fieldKey) =>
    hasVisibleFieldValue(fields[fieldKey]),
  ).length;

  return {
    pageResult: rawPageExtractionSchema.parse({
      pageNumber: page.pageNumber,
      sectionTitle: pageConfig.title,
      pageSummary: `${pageConfig.description} Captured ${filledCount} of ${pageConfig.fieldKeys.length} fields.`,
      transcribedText,
      confidenceNotes: uniqueStrings(pageNotes),
      missingOrUnclearFields,
      fields,
    }),
    debugTraces: debug ? dedupeDebugTraces(debugTraces) : [],
  };
}

function shouldRunFieldFallback(
  fieldKey: Parameters<typeof getTemplateField>[0],
  value: RawPageFieldValue | undefined,
) {
  const field = getTemplateField(fieldKey);
  const result = value ?? buildBlankRawFieldValue("No extraction data returned for this field.");

  if (field.pageNumber < 2) {
    return false;
  }

  if (looksLikeQuestionEcho(fieldKey, result.value)) {
    return true;
  }

  if (result.confidence !== "high") {
    return true;
  }

  if (result.uncertainty.trim()) {
    return true;
  }

  if (result.isBlank && result.confidence !== "high") {
    return true;
  }

  return false;
}

function shouldReplaceFieldResult(
  fieldKey: Parameters<typeof getTemplateField>[0],
  primary: RawPageFieldValue | undefined,
  fallback: RawPageFieldValue,
) {
  if (!primary) {
    return true;
  }

  if (looksLikeQuestionEcho(fieldKey, primary.value) && !looksLikeQuestionEcho(fieldKey, fallback.value)) {
    return true;
  }

  const primaryScore = scoreFieldResult(fieldKey, primary);
  const fallbackScore = scoreFieldResult(fieldKey, fallback);

  if (fallback.isBlank === false && primary.isBlank === true) {
    return true;
  }

  return fallbackScore > primaryScore;
}

function scoreFieldResult(
  fieldKey: Parameters<typeof getTemplateField>[0],
  result: RawPageFieldValue,
) {
  const confidenceWeight =
    result.confidence === "high" ? 30 : result.confidence === "medium" ? 20 : 10;
  const nonBlankWeight = hasVisibleFieldValue(result) ? 6 : result.isBlank ? 3 : 0;
  const uncertaintyPenalty = result.uncertainty.trim() ? -8 : 0;
  const echoPenalty = looksLikeQuestionEcho(fieldKey, result.value) ? -20 : 0;

  return confidenceWeight + nonBlankWeight + uncertaintyPenalty + echoPenalty;
}

function buildPageTranscription(
  fieldKeys: readonly GtiExtractedFieldKey[],
  fields: Record<string, RawPageFieldValue>,
) {
  return fieldKeys
    .map((fieldKey) => {
      const rawField = fields[fieldKey];
      const displayValue = getRawFieldDisplayValue(rawField);

      if (!displayValue) {
        return "";
      }

      return `${getTemplateField(fieldKey).label}: ${displayValue}`;
    })
    .filter(Boolean)
    .join("\n");
}

function shouldFlagFieldForReview(value: RawPageFieldValue | undefined) {
  if (!value) {
    return true;
  }

  if (value.uncertainty.trim()) {
    return true;
  }

  return value.confidence === "low" && !value.isBlank;
}

function hasVisibleFieldValue(value: RawPageFieldValue | undefined) {
  if (!value) {
    return false;
  }

  return Boolean(getRawFieldDisplayValue(value));
}

function getRawFieldDisplayValue(value: RawPageFieldValue | undefined) {
  if (!value) {
    return "";
  }

  if (value.selectedValues.length > 0) {
    return value.selectedValues.join(", ");
  }

  return value.value.trim();
}

function looksLikeQuestionEcho(
  fieldKey: Parameters<typeof getTemplateField>[0],
  value: string,
) {
  const cleanedValue = normalizeToken(value);

  if (!cleanedValue) {
    return false;
  }

  const field = getTemplateField(fieldKey);
  const labelToken = normalizeToken(field.label);
  const questionToken = normalizeToken(field.question);

  return (
    cleanedValue === labelToken ||
    cleanedValue === questionToken ||
    labelToken.includes(cleanedValue) ||
    questionToken.includes(cleanedValue)
  );
}

function buildBlankRawPageResult({
  pageNumber,
  message,
}: {
  pageNumber: number;
  message: string;
}): RawPageExtraction {
  const pageConfig = getGtiPageConfig(pageNumber);

  if (!pageConfig) {
    return rawPageExtractionSchema.parse({
      pageNumber,
      sectionTitle: "",
      pageSummary: "",
      transcribedText: "",
      confidenceNotes: [message],
      missingOrUnclearFields: [],
      fields: {},
    });
  }

  const fields = Object.fromEntries(
    pageConfig.fieldKeys.map((fieldKey) => [fieldKey, buildBlankRawFieldValue(message)]),
  );

  return rawPageExtractionSchema.parse({
    pageNumber,
    sectionTitle: pageConfig.title,
    pageSummary: pageConfig.description,
    transcribedText: "",
    confidenceNotes: [message],
    missingOrUnclearFields: pageConfig.fieldKeys,
    fields,
  });
}

function buildBlankRawFieldValue(message: string): RawPageFieldValue {
  return rawPageFieldValueSchema.parse({
    value: "",
    selectedValues: [],
    evidence: "",
    reasoning: "",
    confidence: fieldConfidenceSchema.parse("low"),
    isBlank: true,
    uncertainty: message,
  });
}

function transformRawPageResultSafely(page: RawPageExtraction) {
  const validated = rawPageExtractionSchema.safeParse(page);

  if (!validated.success) {
    return null;
  }

  return normalizeGtiDocument({
    fileName: "",
    pageResults: [validated.data],
    pageCount: 1,
  }).pageExtractions[0] ?? null;
}

function isDocumentReliable({
  failedPageCount,
  normalized,
  pageCount,
}: {
  failedPageCount: number;
  normalized: NormalizedFeedbackForm;
  pageCount: number;
}) {
  return (
    failedPageCount === 0 &&
    pageCount >= GTI_EXPECTED_PAGE_COUNT &&
    hasAnyNormalizedFeedbackValue(normalized)
  );
}

function buildFailureMessage({
  pageCount,
  failedPageCount,
  normalized,
}: {
  pageCount: number;
  failedPageCount: number;
  normalized: NormalizedFeedbackForm;
}) {
  if (pageCount < GTI_EXPECTED_PAGE_COUNT) {
    return `This file is incomplete. The GTI feedback form expects ${GTI_EXPECTED_PAGE_COUNT} pages, but only ${pageCount} page${pageCount === 1 ? "" : "s"} were provided.`;
  }

  if (failedPageCount > 0) {
    return "One or more GTI form pages could not be read with enough confidence. Review the flagged fields before export.";
  }

  if (!hasAnyNormalizedFeedbackValue(normalized)) {
    return "The GTI feedback form could not be normalized with enough reliable detail.";
  }

  return "The GTI feedback form needs review before export.";
}

function buildFailedProcessedDocument({
  fileName,
  mimeType,
  sourceKind,
  pageCount,
  pageExtractions,
  message,
  debugTraces,
  includeDebug,
}: {
  fileName: string;
  mimeType: string;
  sourceKind: "image" | "pdf";
  pageCount: number;
  pageExtractions: PageExtraction[];
  message: string;
  debugTraces: ExtractionDebugTrace[];
  includeDebug: boolean;
}) {
  const normalized = createEmptyNormalizedFeedbackForm(fileName);
  normalized.confidenceNotes = uniqueStrings([
    message,
    ...pageExtractions.flatMap((page) => page.confidenceNotes),
  ]);
  normalized.missingOrUnclearFields = uniqueStrings([
    ...normalizedFeedbackScalarFieldKeys.filter((key) => key !== "sourceFileName"),
    ...pageExtractions.flatMap((page) => page.missingOrUnclearFields),
  ]);

  return processedFeedbackDocumentSchema.parse({
    sourceFileName: fileName,
    sourceMimeType: mimeType,
    sourceKind,
    pageCount,
    status: "failed",
    normalized,
    pageExtractions,
    combinedTranscription: pageExtractions
      .map((page) => page.transcribedText)
      .filter(Boolean)
      .join("\n\n"),
    errorMessage: message,
    ...(includeDebug ? { debug: { fieldTraces: dedupeDebugTraces(debugTraces) } } : {}),
  });
}

async function mapWithConcurrency<TInput, TOutput>(
  items: readonly TInput[],
  concurrency: number,
  iteratee: (item: TInput) => Promise<TOutput>,
) {
  const results: TOutput[] = new Array(items.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await iteratee(items[currentIndex]);
      }
    }),
  );

  return results;
}

function dedupeDebugTraces(traces: ExtractionDebugTrace[]) {
  const seen = new Set<string>();
  const unique: ExtractionDebugTrace[] = [];

  for (const trace of traces) {
    const key = [
      trace.field,
      trace.page,
      trace.groupId,
      trace.cropLabel,
      trace.value,
      trace.selectedValues.join("|"),
      trace.confidence,
      trace.uncertainty,
    ].join("::");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(trace);
  }

  return unique;
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function toExtractionErrorMessage(error: unknown) {
  if (error instanceof FeedbackExtractionError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "The form could not be processed.";
}

class FeedbackExtractionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
