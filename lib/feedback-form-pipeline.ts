import "server-only";

import OpenAI from "openai";
import {
  DOCUMENT_NORMALIZATION_JSON_SCHEMA,
  DOCUMENT_NORMALIZATION_PROMPT,
  PAGE_EXTRACTION_JSON_SCHEMA,
  PAGE_EXTRACTION_PROMPT,
} from "@/lib/extract-prompt";
import {
  getDocumentNormalizationModel,
  getImageInputDetail,
  getOpenAIClient,
  getPageExtractionModel,
  supportsReasoningEffort,
} from "@/lib/openai";
import { renderPdfToPngPages } from "@/lib/pdf";
import {
  createEmptyNormalizedFeedbackForm,
  extractionBatchResultSchema,
  hasAnyNormalizedFeedbackValue,
  normalizedFeedbackScalarFieldKeys,
  normalizedFeedbackFormSchema,
  pageExtractionSchema,
  processedFeedbackDocumentSchema,
  type ExtractionBatchResult,
  type NormalizedFeedbackForm,
  type PageExtraction,
  type ProcessedFeedbackDocument,
} from "@/lib/types";

type SupportedSourceFile = {
  fileName: string;
  mimeType: string;
  bytes: Buffer;
};

type RenderedSourcePage = {
  pageNumber: number;
  mimeType: string;
  bytes: Buffer;
};

export async function extractFeedbackForms(
  files: SupportedSourceFile[],
): Promise<ExtractionBatchResult> {
  getOpenAIClient();

  const documents: ProcessedFeedbackDocument[] = [];
  let totalPages = 0;

  for (const file of files) {
    const document = await processSingleFile(file);
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

async function processSingleFile({
  bytes,
  fileName,
  mimeType,
}: SupportedSourceFile): Promise<ProcessedFeedbackDocument> {
  const sourceKind = mimeType === "application/pdf" ? "pdf" : "image";
  let renderedPages: RenderedSourcePage[] = [];
  let pageExtractions: PageExtraction[] = [];

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

    pageExtractions = [];

    for (const page of renderedPages) {
      pageExtractions.push(
        await extractSinglePage({
          fileName,
          totalPages: renderedPages.length,
          page,
        }),
      );
    }

    const normalized = await normalizeDocument({
      fileName,
      pageExtractions,
    });

    const combinedTranscription = buildCombinedTranscription(pageExtractions);
    const isReliable = isDocumentReliable(normalized, pageExtractions);

    return processedFeedbackDocumentSchema.parse({
      sourceFileName: fileName,
      sourceMimeType: mimeType,
      sourceKind,
      pageCount: renderedPages.length,
      status: isReliable ? "completed" : "failed",
      normalized: normalizeFeedbackDocument(normalized, fileName),
      pageExtractions: pageExtractions.map(normalizePageExtraction),
      combinedTranscription,
      errorMessage: isReliable
        ? ""
        : "The form could not be normalized with enough reliable detail.",
    });
  } catch (error) {
    return buildFailedProcessedDocument({
      fileName,
      mimeType,
      sourceKind,
      pageCount: renderedPages.length || pageExtractions.length,
      pageExtractions,
      message: toExtractionErrorMessage(error),
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
}: {
  fileName: string;
  totalPages: number;
  page: RenderedSourcePage;
}) {
  const client = getOpenAIClient();
  const model = getPageExtractionModel();
  const imageDetail = getImageInputDetail(model);
  const response = await createStructuredResponse({
    client,
    model,
    instructions: PAGE_EXTRACTION_PROMPT,
    schemaName: "gti_feedback_page_extraction",
    schema: PAGE_EXTRACTION_JSON_SCHEMA,
    maxOutputTokens: 2600,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "Extract only this single page from a GTI feedback form.",
              `Source file: ${fileName}`,
              `Page number: ${page.pageNumber}`,
              `Total pages in document: ${totalPages}`,
            ].join("\n"),
          },
          {
            type: "input_image",
            detail: imageDetail,
            image_url: `data:${page.mimeType};base64,${page.bytes.toString("base64")}`,
          },
        ],
      },
    ],
  });

  const validated = pageExtractionSchema.safeParse(response);

  if (!validated.success) {
    throw new FeedbackExtractionError(
      "INVALID_AI_RESPONSE",
      `The page extraction response for page ${page.pageNumber} did not match the expected schema.`,
    );
  }

  return normalizePageExtraction(validated.data);
}

async function normalizeDocument({
  fileName,
  pageExtractions,
}: {
  fileName: string;
  pageExtractions: PageExtraction[];
}) {
  const client = getOpenAIClient();
  const model = getDocumentNormalizationModel();
  const response = await createStructuredResponse({
    client,
    model,
    instructions: DOCUMENT_NORMALIZATION_PROMPT,
    schemaName: "gti_feedback_document_normalized",
    schema: DOCUMENT_NORMALIZATION_JSON_SCHEMA,
    maxOutputTokens: 2200,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "Normalize the supplied page extraction JSON into one strict GTI feedback-form record.",
              `Source file name: ${fileName}`,
              "",
              JSON.stringify(pageExtractions, null, 2),
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const validated = normalizedFeedbackFormSchema.safeParse(response);

  if (!validated.success) {
    throw new FeedbackExtractionError(
      "INVALID_AI_RESPONSE",
      "The document normalization response did not match the expected schema.",
    );
  }

  return validated.data;
}

async function createStructuredResponse({
  client,
  model,
  instructions,
  input,
  schemaName,
  schema,
  maxOutputTokens,
}: {
  client: OpenAI;
  model: string;
  instructions: string;
  input: OpenAI.Responses.ResponseCreateParams["input"];
  schemaName: string;
  schema: Record<string, unknown>;
  maxOutputTokens: number;
}) {
  try {
    const response = await client.responses.create({
      model,
      store: false,
      ...(supportsReasoningEffort(model)
        ? {
            reasoning: {
              effort: "medium" as const,
            },
          }
        : {}),
      instructions,
      max_output_tokens: maxOutputTokens,
      input,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    });

    const rawOutput = response.output_text?.trim();

    if (!rawOutput) {
      throw new FeedbackExtractionError(
        "INVALID_AI_RESPONSE",
        "OpenAI returned an empty structured extraction response.",
      );
    }

    try {
      return JSON.parse(rawOutput) as unknown;
    } catch {
      throw new FeedbackExtractionError(
        "INVALID_AI_RESPONSE",
        "OpenAI returned malformed JSON for the structured extraction response.",
      );
    }
  } catch (error) {
    if (error instanceof FeedbackExtractionError) {
      throw error;
    }

    throw new FeedbackExtractionError(
      "OPENAI_ERROR",
      error instanceof Error
        ? error.message
        : "OpenAI could not process the document right now.",
    );
  }
}

function normalizePageExtraction(page: PageExtraction): PageExtraction {
  return {
    pageNumber: page.pageNumber,
    sectionTitle: cleanString(page.sectionTitle),
    pageSummary: cleanString(page.pageSummary),
    transcribedText: cleanString(page.transcribedText),
    extractedItems: page.extractedItems.map((item) => ({
      label: cleanString(item.label),
      answer: cleanString(item.answer),
      answerType: item.answerType,
      selectedOptions: normalizeStringArray(item.selectedOptions),
      evidence: cleanString(item.evidence),
      isBlank: item.isBlank,
      uncertainty: cleanString(item.uncertainty),
    })),
    confidenceNotes: normalizeStringArray(page.confidenceNotes),
    missingOrUnclearFields: normalizeStringArray(page.missingOrUnclearFields),
  };
}

function normalizeFeedbackDocument(
  document: NormalizedFeedbackForm,
  fileName: string,
): NormalizedFeedbackForm {
  return {
    sourceFileName: cleanString(document.sourceFileName) || fileName,
    cityAreaName: cleanString(document.cityAreaName),
    milanoSkuTested: cleanString(document.milanoSkuTested),
    cigaretteFilterType: cleanString(document.cigaretteFilterType),
    respondentType: cleanString(document.respondentType),
    respondentAgeGroup: cleanString(document.respondentAgeGroup),
    smokingFrequency: cleanString(document.smokingFrequency),
    drawEffort: cleanString(document.drawEffort),
    smokeVolume: cleanString(document.smokeVolume),
    smokeSmoothness: cleanString(document.smokeSmoothness),
    tasteFlavorFeeling: cleanString(document.tasteFlavorFeeling),
    aftertasteFeeling: cleanString(document.aftertasteFeeling),
    filterComfortFeel: cleanString(document.filterComfortFeel),
    burningSpeed: cleanString(document.burningSpeed),
    ashQualityColor: cleanString(document.ashQualityColor),
    tasteFlavorConsistency: cleanString(document.tasteFlavorConsistency),
    outerPackVisualAppeal: cleanString(document.outerPackVisualAppeal),
    packColourAttractiveness: cleanString(document.packColourAttractiveness),
    packQualityFeelOpeningStrength: cleanString(
      document.packQualityFeelOpeningStrength,
    ),
    priceValueMilanoOdysseyBlack: cleanString(
      document.priceValueMilanoOdysseyBlack,
    ),
    priceValueMilanoOdysseyGold: cleanString(document.priceValueMilanoOdysseyGold),
    priceValueMilanoCherryVintage: cleanString(
      document.priceValueMilanoCherryVintage,
    ),
    overallSatisfactionRating: cleanString(document.overallSatisfactionRating),
    mainReasonForRating: cleanString(document.mainReasonForRating),
    wouldBuy: cleanString(document.wouldBuy),
    wouldRecommend: cleanString(document.wouldRecommend),
    likedMost: cleanString(document.likedMost),
    shouldImprove: cleanString(document.shouldImprove),
    brandSmokedMostOften: cleanString(document.brandSmokedMostOften),
    confidenceNotes: normalizeStringArray(document.confidenceNotes),
    missingOrUnclearFields: normalizeStringArray(document.missingOrUnclearFields),
  };
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

function isDocumentReliable(
  normalized: NormalizedFeedbackForm,
  pageExtractions: PageExtraction[],
) {
  const hasStructuredValues = hasAnyNormalizedFeedbackValue(normalized);
  const hasPageAnswers = pageExtractions.some((page) =>
    page.extractedItems.some(
      (item) =>
        item.answer.trim().length > 0 || item.selectedOptions.some(Boolean),
    ),
  );
  const hasTranscription = pageExtractions.some(
    (page) => page.transcribedText.trim().length > 16,
  );

  return hasStructuredValues || hasPageAnswers || hasTranscription;
}

function buildFailedProcessedDocument({
  fileName,
  mimeType,
  sourceKind,
  pageCount,
  pageExtractions,
  message,
}: {
  fileName: string;
  mimeType: string;
  sourceKind: "image" | "pdf";
  pageCount: number;
  pageExtractions: PageExtraction[];
  message: string;
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
    pageExtractions: pageExtractions.map(normalizePageExtraction),
    combinedTranscription: buildCombinedTranscription(pageExtractions),
    errorMessage: message,
  });
}

function normalizeStringArray(values: string[]) {
  return uniqueStrings(values.map(cleanString).filter(Boolean));
}

function cleanString(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
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
