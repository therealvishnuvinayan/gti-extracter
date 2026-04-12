import { z } from "zod";
import {
  gtiAshQualityColorOptions,
  gtiCigaretteFilterTypeOptions,
  gtiDecisionOptions,
  gtiExtractedFieldKeys,
  gtiFieldLabels,
  gtiMainReasonForRatingOptions,
  gtiMilanoSkuOptions,
  gtiPriceValueOptions,
  gtiRespondentAgeGroupOptions,
  gtiRespondentTypeOptions,
  gtiScale1To3Values,
  gtiScale1To5Values,
  gtiSmokingFrequencyOptions,
  gtiStructuredFieldKeys,
  type GtiExtractedFieldKey,
  type GtiStructuredFieldKey,
} from "@/lib/gti/template";

const blankableEnumSchema = <T extends readonly [string, ...string[]]>(values: T) =>
  z.union([z.literal(""), z.enum(values)]);

export const pageAnswerTypeSchema = z.enum([
  "text",
  "choice",
  "rating",
  "comment",
  "brand",
  "numeric",
  "unknown",
]);

export const fieldConfidenceSchema = z.enum(["high", "medium", "low"]);

export const pageExtractedItemSchema = z
  .object({
    fieldKey: z.enum(gtiExtractedFieldKeys),
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
    milanoSkuTested: blankableEnumSchema(gtiMilanoSkuOptions),
    cigaretteFilterType: blankableEnumSchema(gtiCigaretteFilterTypeOptions),
    respondentType: blankableEnumSchema(gtiRespondentTypeOptions),
    respondentAgeGroup: blankableEnumSchema(gtiRespondentAgeGroupOptions),
    brandSmokedMostOften: z.string(),
    smokingFrequency: blankableEnumSchema(gtiSmokingFrequencyOptions),
    drawEffort: blankableEnumSchema(gtiScale1To5Values),
    smokeVolume: blankableEnumSchema(gtiScale1To5Values),
    smokeSmoothness: blankableEnumSchema(gtiScale1To5Values),
    tasteFlavorFeeling: blankableEnumSchema(gtiScale1To5Values),
    aftertasteFeeling: blankableEnumSchema(gtiScale1To5Values),
    filterComfortFeel: blankableEnumSchema(gtiScale1To5Values),
    burningSpeed: blankableEnumSchema(gtiScale1To5Values),
    ashQualityColor: blankableEnumSchema(gtiAshQualityColorOptions),
    tasteFlavorConsistency: blankableEnumSchema(gtiScale1To3Values),
    outerPackVisualAppeal: blankableEnumSchema(gtiScale1To5Values),
    packColourAttractiveness: blankableEnumSchema(gtiScale1To5Values),
    packQualityFeelOpeningStrength: blankableEnumSchema(gtiScale1To5Values),
    priceValueMilanoOdysseyBlack: blankableEnumSchema(gtiPriceValueOptions),
    priceValueMilanoOdysseyGold: blankableEnumSchema(gtiPriceValueOptions),
    priceValueMilanoCherryVintage: blankableEnumSchema(gtiPriceValueOptions),
    overallSatisfactionRating: blankableEnumSchema(gtiScale1To5Values),
    mainReasonForRating: z.array(z.enum(gtiMainReasonForRatingOptions)).max(2),
    wouldBuy: blankableEnumSchema(gtiDecisionOptions),
    wouldRecommend: blankableEnumSchema(gtiDecisionOptions),
    likedMost: z.string(),
    shouldImprove: z.string(),
    confidenceNotes: z.array(z.string()),
    missingOrUnclearFields: z.array(z.string()),
  })
  .strict();

export const rawPageFieldValueSchema = z
  .object({
    value: z.string(),
    selectedValues: z.array(z.string()),
    evidence: z.string(),
    reasoning: z.string(),
    confidence: fieldConfidenceSchema,
    isBlank: z.boolean(),
    uncertainty: z.string(),
  })
  .strict();

export const extractionDebugTraceSchema = z
  .object({
    field: z.enum(gtiExtractedFieldKeys),
    page: z.number().int().positive(),
    groupId: z.string(),
    cropLabel: z.string(),
    value: z.string(),
    selectedValues: z.array(z.string()),
    evidence: z.string(),
    reasoning: z.string(),
    confidence: fieldConfidenceSchema,
    uncertainty: z.string(),
  })
  .strict();

export const extractionDebugSchema = z
  .object({
    fieldTraces: z.array(extractionDebugTraceSchema),
  })
  .strict();

export const rawPageExtractionSchema = z
  .object({
    pageNumber: z.number().int().positive(),
    sectionTitle: z.string(),
    pageSummary: z.string(),
    transcribedText: z.string(),
    confidenceNotes: z.array(z.string()),
    missingOrUnclearFields: z.array(z.string()),
    fields: z.record(z.string(), rawPageFieldValueSchema),
  })
  .strict();

export type RawPageFieldValue = z.infer<typeof rawPageFieldValueSchema>;
export type RawPageExtraction = z.infer<typeof rawPageExtractionSchema>;
export type PageAnswerType = z.infer<typeof pageAnswerTypeSchema>;
export type PageExtractedItem = z.infer<typeof pageExtractedItemSchema>;
export type PageExtraction = z.infer<typeof pageExtractionSchema>;
export type NormalizedFeedbackForm = z.infer<typeof normalizedFeedbackFormSchema>;
export type FieldConfidence = z.infer<typeof fieldConfidenceSchema>;
export type ExtractionDebugTrace = z.infer<typeof extractionDebugTraceSchema>;
export type ExtractionDebug = z.infer<typeof extractionDebugSchema>;

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
    brandSmokedMostOften: "",
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
    mainReasonForRating: [],
    wouldBuy: "",
    wouldRecommend: "",
    likedMost: "",
    shouldImprove: "",
    confidenceNotes: [],
    missingOrUnclearFields: [],
  };
}

export function formatNormalizedFieldValue(
  value: string | string[],
  separator = ", ",
) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(separator);
  }

  return value;
}

export function getNormalizedFieldDisplayValue(
  normalized: NormalizedFeedbackForm,
  fieldKey: GtiStructuredFieldKey,
  separator = ", ",
) {
  return formatNormalizedFieldValue(normalized[fieldKey], separator);
}

export function hasNormalizedFieldValue(
  normalized: NormalizedFeedbackForm,
  fieldKey: GtiStructuredFieldKey,
) {
  const value = normalized[fieldKey];

  if (Array.isArray(value)) {
    return value.some((item) => item.trim().length > 0);
  }

  return value.trim().length > 0;
}

export function sanitizeMissingFieldKeys(values: string[]) {
  const allowedKeys = new Set<GtiExtractedFieldKey>(gtiExtractedFieldKeys);

  return [...new Set(values)]
    .map((value) => value.trim())
    .filter(
      (value): value is GtiExtractedFieldKey =>
        allowedKeys.has(value as GtiExtractedFieldKey),
    );
}

export function getFieldLabel(fieldKey: GtiStructuredFieldKey | GtiExtractedFieldKey) {
  return gtiFieldLabels[fieldKey];
}

export { gtiFieldLabels, gtiStructuredFieldKeys };
