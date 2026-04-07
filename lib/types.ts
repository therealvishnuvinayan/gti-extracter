import { z } from "zod";

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

export const normalizedFeedbackScalarFieldKeys = [
  "sourceFileName",
  "cityAreaName",
  "milanoSkuTested",
  "cigaretteFilterType",
  "respondentType",
  "respondentAgeGroup",
  "smokingFrequency",
  "drawEffort",
  "smokeVolume",
  "smokeSmoothness",
  "tasteFlavorFeeling",
  "aftertasteFeeling",
  "filterComfortFeel",
  "burningSpeed",
  "ashQualityColor",
  "tasteFlavorConsistency",
  "outerPackVisualAppeal",
  "packColourAttractiveness",
  "packQualityFeelOpeningStrength",
  "priceValueMilanoOdysseyBlack",
  "priceValueMilanoOdysseyGold",
  "priceValueMilanoCherryVintage",
  "overallSatisfactionRating",
  "mainReasonForRating",
  "wouldBuy",
  "wouldRecommend",
  "likedMost",
  "shouldImprove",
  "brandSmokedMostOften",
] as const;

export const normalizedFeedbackFieldKeys = [
  ...normalizedFeedbackScalarFieldKeys,
  "confidenceNotes",
  "missingOrUnclearFields",
] as const;

export type NormalizedFeedbackScalarFieldKey =
  (typeof normalizedFeedbackScalarFieldKeys)[number];
export type NormalizedFeedbackFieldKey = (typeof normalizedFeedbackFieldKeys)[number];

export const normalizedFeedbackFieldLabels: Record<
  NormalizedFeedbackFieldKey,
  string
> = {
  sourceFileName: "Source File Name",
  cityAreaName: "City / Area Name",
  milanoSkuTested: "Milano SKU Tested",
  cigaretteFilterType: "Cigarette Filter Type",
  respondentType: "Respondent Type",
  respondentAgeGroup: "Respondent Age Group",
  smokingFrequency: "Smoking Frequency",
  drawEffort: "Draw Effort",
  smokeVolume: "Smoke Volume",
  smokeSmoothness: "Smoke Smoothness",
  tasteFlavorFeeling: "Taste / Flavor Feeling",
  aftertasteFeeling: "Aftertaste Feeling",
  filterComfortFeel: "Filter Comfort Feel",
  burningSpeed: "Burning Speed",
  ashQualityColor: "Ash Quality / Color",
  tasteFlavorConsistency: "Taste / Flavor Consistency",
  outerPackVisualAppeal: "Outer Pack Visual Appeal",
  packColourAttractiveness: "Pack Colour Attractiveness",
  packQualityFeelOpeningStrength: "Pack Quality / Feel / Opening Strength",
  priceValueMilanoOdysseyBlack: "Price / Value - Milano Odyssey Black",
  priceValueMilanoOdysseyGold: "Price / Value - Milano Odyssey Gold",
  priceValueMilanoCherryVintage: "Price / Value - Milano Cherry Vintage",
  overallSatisfactionRating: "Overall Satisfaction Rating",
  mainReasonForRating: "Main Reason For Rating",
  wouldBuy: "Would Buy",
  wouldRecommend: "Would Recommend",
  likedMost: "Liked Most",
  shouldImprove: "Should Improve",
  brandSmokedMostOften: "Brand Smoked Most Often",
  confidenceNotes: "Confidence Notes",
  missingOrUnclearFields: "Missing Or Unclear Fields",
};

export const pageAnswerTypeSchema = z.enum([
  "text",
  "choice",
  "rating",
  "comment",
  "brand",
  "numeric",
  "unknown",
]);

export const pageExtractedItemSchema = z
  .object({
    label: z.string(),
    answer: z.string(),
    answerType: pageAnswerTypeSchema,
    selectedOptions: z.array(z.string()),
    evidence: z.string(),
    isBlank: z.boolean(),
    uncertainty: z.string(),
  })
  .strict();

export const pageExtractionSchema = z
  .object({
    pageNumber: z.number().int().positive(),
    sectionTitle: z.string(),
    pageSummary: z.string(),
    transcribedText: z.string(),
    extractedItems: z.array(pageExtractedItemSchema),
    confidenceNotes: z.array(z.string()),
    missingOrUnclearFields: z.array(z.string()),
  })
  .strict();

export const normalizedFeedbackFormSchema = z
  .object({
    sourceFileName: z.string(),
    cityAreaName: z.string(),
    milanoSkuTested: z.string(),
    cigaretteFilterType: z.string(),
    respondentType: z.string(),
    respondentAgeGroup: z.string(),
    smokingFrequency: z.string(),
    drawEffort: z.string(),
    smokeVolume: z.string(),
    smokeSmoothness: z.string(),
    tasteFlavorFeeling: z.string(),
    aftertasteFeeling: z.string(),
    filterComfortFeel: z.string(),
    burningSpeed: z.string(),
    ashQualityColor: z.string(),
    tasteFlavorConsistency: z.string(),
    outerPackVisualAppeal: z.string(),
    packColourAttractiveness: z.string(),
    packQualityFeelOpeningStrength: z.string(),
    priceValueMilanoOdysseyBlack: z.string(),
    priceValueMilanoOdysseyGold: z.string(),
    priceValueMilanoCherryVintage: z.string(),
    overallSatisfactionRating: z.string(),
    mainReasonForRating: z.string(),
    wouldBuy: z.string(),
    wouldRecommend: z.string(),
    likedMost: z.string(),
    shouldImprove: z.string(),
    brandSmokedMostOften: z.string(),
    confidenceNotes: z.array(z.string()),
    missingOrUnclearFields: z.array(z.string()),
  })
  .strict();

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

export type PageAnswerType = z.infer<typeof pageAnswerTypeSchema>;
export type PageExtractedItem = z.infer<typeof pageExtractedItemSchema>;
export type PageExtraction = z.infer<typeof pageExtractionSchema>;
export type NormalizedFeedbackForm = z.infer<typeof normalizedFeedbackFormSchema>;
export type ProcessedFeedbackDocument = z.infer<
  typeof processedFeedbackDocumentSchema
>;
export type ExtractionBatchResult = z.infer<typeof extractionBatchResultSchema>;
export type ExtractApiErrorCode = z.infer<typeof extractApiErrorCodeSchema>;
export type BasicApiError = z.infer<typeof basicApiErrorSchema>;
export type FeedbackRecord = z.infer<typeof feedbackRecordSchema>;

export type NormalizedFeedbackFieldView = {
  id: NormalizedFeedbackScalarFieldKey;
  label: string;
  value: string;
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

export function createEmptyNormalizedFeedbackForm(
  sourceFileName = "",
): NormalizedFeedbackForm {
  return {
    sourceFileName,
    cityAreaName: "",
    milanoSkuTested: "",
    cigaretteFilterType: "",
    respondentType: "",
    respondentAgeGroup: "",
    smokingFrequency: "",
    drawEffort: "",
    smokeVolume: "",
    smokeSmoothness: "",
    tasteFlavorFeeling: "",
    aftertasteFeeling: "",
    filterComfortFeel: "",
    burningSpeed: "",
    ashQualityColor: "",
    tasteFlavorConsistency: "",
    outerPackVisualAppeal: "",
    packColourAttractiveness: "",
    packQualityFeelOpeningStrength: "",
    priceValueMilanoOdysseyBlack: "",
    priceValueMilanoOdysseyGold: "",
    priceValueMilanoCherryVintage: "",
    overallSatisfactionRating: "",
    mainReasonForRating: "",
    wouldBuy: "",
    wouldRecommend: "",
    likedMost: "",
    shouldImprove: "",
    brandSmokedMostOften: "",
    confidenceNotes: [],
    missingOrUnclearFields: [],
  };
}

export function toNormalizedFeedbackFieldViews(
  normalized: NormalizedFeedbackForm,
): NormalizedFeedbackFieldView[] {
  return normalizedFeedbackScalarFieldKeys.map((key) => ({
    id: key,
    label: normalizedFeedbackFieldLabels[key],
    value: normalized[key],
  }));
}

export function hasAnyNormalizedFeedbackValue(normalized: NormalizedFeedbackForm) {
  return normalizedFeedbackScalarFieldKeys.some((key) => {
    if (key === "sourceFileName") {
      return false;
    }

    return normalized[key].trim().length > 0;
  });
}

export function getSuccessfulDocuments(result: ExtractionBatchResult) {
  return result.documents.filter((document) => document.status === "completed");
}
