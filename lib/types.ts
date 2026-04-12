import { z } from "zod";
import {
  createEmptyNormalizedFeedbackForm as createEmptyGtiNormalizedFeedbackForm,
  extractionDebugSchema,
  getNormalizedFieldDisplayValue,
  gtiFieldLabels as normalizedFeedbackFieldLabels,
  gtiStructuredFieldKeys as normalizedFeedbackScalarFieldKeys,
  hasNormalizedFieldValue,
  normalizedFeedbackFormSchema,
  pageAnswerTypeSchema,
  pageExtractedItemSchema,
  pageExtractionSchema,
  type NormalizedFeedbackForm,
  type PageAnswerType,
  type PageExtractedItem,
  type PageExtraction,
} from "@/lib/gti/schema";
import {
  gtiFieldKeys,
  type GtiFieldKey,
  type GtiStructuredFieldKey,
} from "@/lib/gti/template";

export const SUPPORTED_SOURCE_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const ACCEPTED_SOURCE_FILE_TYPES = SUPPORTED_SOURCE_FILE_TYPES.join(",");

export const SUPPORTED_TEMPLATE_FILE_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const ACCEPTED_TEMPLATE_FILE_TYPES = [
  ".xlsx",
  ...SUPPORTED_TEMPLATE_FILE_TYPES,
].join(",");

export const normalizedFeedbackFieldKeys = gtiFieldKeys;

export type NormalizedFeedbackScalarFieldKey = GtiStructuredFieldKey;
export type NormalizedFeedbackFieldKey = GtiFieldKey;

export const processedFeedbackDocumentSchema = z
  .object({
    sourceFileName: z.string(),
    sourceMimeType: z.string(),
    sourceKind: z.enum(["image", "pdf"]),
    pageCount: z.number().int().nonnegative(),
    status: z.enum(["completed", "failed"]),
    normalized: normalizedFeedbackFormSchema,
    pageExtractions: z.array(pageExtractionSchema),
    combinedTranscription: z.string(),
    errorMessage: z.string(),
    debug: extractionDebugSchema.optional(),
  })
  .strict();

export const extractionBatchSummarySchema = z
  .object({
    totalFiles: z.number().int().nonnegative(),
    completedFiles: z.number().int().nonnegative(),
    failedFiles: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

export const extractionBatchResultSchema = z
  .object({
    documents: z.array(processedFeedbackDocumentSchema),
    summary: extractionBatchSummarySchema,
  })
  .strict();

export const extractApiErrorCodeSchema = z.enum([
  "BAD_REQUEST",
  "EMPTY_FILE",
  "UNSUPPORTED_FILE_TYPE",
  "TOO_MANY_FILES",
  "OPENAI_NOT_CONFIGURED",
  "OPENAI_ERROR",
  "PDF_RENDER_ERROR",
  "INVALID_AI_RESPONSE",
  "UNCLEAR_DOCUMENT",
  "TEMPLATE_INVALID",
  "INTERNAL_ERROR",
]);

export const extractApiSuccessSchema = z.object({
  success: z.literal(true),
  data: extractionBatchResultSchema,
});

export const extractApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: extractApiErrorCodeSchema,
    message: z.string(),
  }),
});

export const basicApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
  }),
});

export const feedbackRecordSchema = z
  .object({
    id: z.string(),
    createdAt: z.string(),
    sourceFileName: z.string().nullable(),
    cityAreaName: z.string().nullable(),
    milanoSkuTested: z.string().nullable(),
    cigaretteFilterType: z.string().nullable(),
    respondentType: z.string().nullable(),
    respondentAgeGroup: z.string().nullable(),
    smokingFrequency: z.string().nullable(),
    drawEffort: z.string().nullable(),
    smokeVolume: z.string().nullable(),
    smokeSmoothness: z.string().nullable(),
    tasteFlavorFeeling: z.string().nullable(),
    aftertasteFeeling: z.string().nullable(),
    filterComfortFeel: z.string().nullable(),
    burningSpeed: z.string().nullable(),
    ashQualityColor: z.string().nullable(),
    tasteFlavorConsistency: z.string().nullable(),
    outerPackVisualAppeal: z.string().nullable(),
    packColourAttractiveness: z.string().nullable(),
    packQualityFeelOpeningStrength: z.string().nullable(),
    priceBlack: z.string().nullable(),
    priceGold: z.string().nullable(),
    priceCherry: z.string().nullable(),
    overallSatisfactionRating: z.string().nullable(),
    mainReasonForRating: z.string().nullable(),
    wouldBuy: z.string().nullable(),
    wouldRecommend: z.string().nullable(),
    likedMost: z.string().nullable(),
    shouldImprove: z.string().nullable(),
    brandSmokedMostOften: z.string().nullable(),
    confidenceNotes: z.array(z.string()),
    missingFields: z.array(z.string()),
  })
  .strict();

export const saveRecordsApiSuccessSchema = z.object({
  success: z.literal(true),
  savedCount: z.number().int().nonnegative(),
  records: z.array(feedbackRecordSchema),
});

export const recordsApiSuccessSchema = z.object({
  success: z.literal(true),
  records: z.array(feedbackRecordSchema),
});

export const deleteRecordApiSuccessSchema = z.object({
  success: z.literal(true),
  id: z.string(),
});

export const extractionBatchStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "partial",
  "cancelled",
  "failed",
]);

export const extractionBatchItemStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

export const extractionBatchItemSchema = z
  .object({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    batchId: z.string(),
    fileName: z.string(),
    mimeType: z.string().nullable(),
    status: extractionBatchItemStatusSchema,
    errorMessage: z.string().nullable(),
    sourceFileName: z.string().nullable(),
    feedbackId: z.string().nullable(),
    queueOrder: z.number().int().nonnegative(),
    startedAt: z.string().nullable(),
    finishedAt: z.string().nullable(),
  })
  .strict();

export const extractionBatchSchema = z
  .object({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    status: extractionBatchStatusSchema,
    totalFiles: z.number().int().nonnegative(),
    processedFiles: z.number().int().nonnegative(),
    successFiles: z.number().int().nonnegative(),
    failedFiles: z.number().int().nonnegative(),
    cancelledFiles: z.number().int().nonnegative(),
    queuedFiles: z.number().int().nonnegative(),
    processingFiles: z.number().int().nonnegative(),
    completedFiles: z.number().int().nonnegative(),
    completionRatio: z.number().min(0).max(1),
    currentItemId: z.string().nullable(),
    currentFileName: z.string().nullable(),
  })
  .strict();

export const createBatchApiSuccessSchema = z.object({
  success: z.literal(true),
  batch: extractionBatchSchema,
  items: z.array(extractionBatchItemSchema),
});

export const batchApiSuccessSchema = z.object({
  success: z.literal(true),
  batch: extractionBatchSchema,
});

export const batchItemsApiSuccessSchema = z.object({
  success: z.literal(true),
  items: z.array(extractionBatchItemSchema),
});

export const batchListApiSuccessSchema = z.object({
  success: z.literal(true),
  batches: z.array(extractionBatchSchema),
});

export const processNextBatchItemApiSuccessSchema = z.object({
  success: z.literal(true),
  batch: extractionBatchSchema,
  item: extractionBatchItemSchema.nullable(),
  record: feedbackRecordSchema.nullable().optional(),
  document: processedFeedbackDocumentSchema.nullable().optional(),
});

export const paginatedRecordsApiSuccessSchema = z.object({
  success: z.literal(true),
  items: z.array(feedbackRecordSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type ProcessedFeedbackDocument = z.infer<
  typeof processedFeedbackDocumentSchema
>;
export type ExtractionBatchResult = z.infer<typeof extractionBatchResultSchema>;
export type ExtractApiErrorCode = z.infer<typeof extractApiErrorCodeSchema>;
export type BasicApiError = z.infer<typeof basicApiErrorSchema>;
export type FeedbackRecord = z.infer<typeof feedbackRecordSchema>;
export type PersistedExtractionBatch = z.infer<typeof extractionBatchSchema>;
export type PersistedExtractionBatchItem = z.infer<typeof extractionBatchItemSchema>;
export type ExtractionBatchStatus = z.infer<typeof extractionBatchStatusSchema>;
export type ExtractionBatchItemStatus = z.infer<
  typeof extractionBatchItemStatusSchema
>;
export type {
  PageAnswerType,
  PageExtractedItem,
  PageExtraction,
  NormalizedFeedbackForm,
};

export type NormalizedFeedbackFieldView = {
  id: NormalizedFeedbackScalarFieldKey;
  label: string;
  value: string;
};

export {
  pageAnswerTypeSchema,
  pageExtractedItemSchema,
  pageExtractionSchema,
  normalizedFeedbackFormSchema,
  normalizedFeedbackScalarFieldKeys,
  normalizedFeedbackFieldLabels,
};

export function isSupportedFileType(value: string) {
  return SUPPORTED_SOURCE_FILE_TYPES.includes(
    value as (typeof SUPPORTED_SOURCE_FILE_TYPES)[number],
  );
}

export function resolveSupportedFileType(fileName: string, mimeType: string) {
  if (isSupportedFileType(mimeType)) {
    return mimeType;
  }

  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (lowerName.endsWith(".png")) {
    return "image/png";
  }

  if (lowerName.endsWith(".webp")) {
    return "image/webp";
  }

  if (lowerName.endsWith(".pdf")) {
    return "application/pdf";
  }

  return null;
}

export function resolveTemplateWorkbookType(fileName: string, mimeType: string) {
  if (
    SUPPORTED_TEMPLATE_FILE_TYPES.includes(
      mimeType as (typeof SUPPORTED_TEMPLATE_FILE_TYPES)[number],
    )
  ) {
    return mimeType;
  }

  if (fileName.toLowerCase().endsWith(".xlsx")) {
    return SUPPORTED_TEMPLATE_FILE_TYPES[0];
  }

  return null;
}

export function createEmptyNormalizedFeedbackForm(sourceFileName = "") {
  return createEmptyGtiNormalizedFeedbackForm(sourceFileName);
}

export function getNormalizedFeedbackFieldValue(
  normalized: NormalizedFeedbackForm,
  key: NormalizedFeedbackScalarFieldKey,
  separator = ", ",
) {
  return getNormalizedFieldDisplayValue(normalized, key, separator);
}

export function toNormalizedFeedbackFieldViews(
  normalized: NormalizedFeedbackForm,
): NormalizedFeedbackFieldView[] {
  return normalizedFeedbackScalarFieldKeys.map((key) => ({
    id: key,
    label: normalizedFeedbackFieldLabels[key],
    value: getNormalizedFieldDisplayValue(normalized, key),
  }));
}

export function hasAnyNormalizedFeedbackValue(normalized: NormalizedFeedbackForm) {
  return normalizedFeedbackScalarFieldKeys.some((key) => {
    if (key === "sourceFileName") {
      return false;
    }

    return hasNormalizedFieldValue(normalized, key);
  });
}

export function getSuccessfulDocuments(result: ExtractionBatchResult) {
  return result.documents.filter((document) => document.status === "completed");
}
