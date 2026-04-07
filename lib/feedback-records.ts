import "server-only";

import type { Feedback, Prisma } from "@prisma/client";
import { feedbackRecordSchema, type FeedbackRecord, type ProcessedFeedbackDocument } from "@/lib/types";

export const FEEDBACK_EXPORT_HEADERS = [
  "Created At",
  "Source File Name",
  "City / Area Name",
  "Milano SKU Tested",
  "Cigarette Filter Type",
  "Respondent Type",
  "Respondent Age Group",
  "Smoking Frequency",
  "Draw Effort",
  "Smoke Volume",
  "Smoke Smoothness",
  "Taste / Flavor Feeling",
  "Aftertaste Feeling",
  "Filter Comfort Feel",
  "Burning Speed",
  "Ash Quality / Color",
  "Taste / Flavor Consistency",
  "Outer Pack Visual Appeal",
  "Pack Colour Attractiveness",
  "Pack Quality / Feel / Opening Strength",
  "Price Black",
  "Price Gold",
  "Price Cherry",
  "Overall Satisfaction Rating",
  "Main Reason For Rating",
  "Would Buy",
  "Would Recommend",
  "Liked Most",
  "Should Improve",
  "Brand Smoked Most Often",
  "Confidence Notes",
  "Missing Fields",
] as const;

export function toFeedbackCreateData(
  document: ProcessedFeedbackDocument,
): Prisma.FeedbackCreateInput {
  const normalized = document.normalized;
  const confidenceNotes = uniqueStrings([
    ...normalized.confidenceNotes,
    ...document.pageExtractions.flatMap((page) => page.confidenceNotes),
    document.errorMessage,
  ]);
  const missingFields = uniqueStrings([
    ...normalized.missingOrUnclearFields,
    ...document.pageExtractions.flatMap((page) => page.missingOrUnclearFields),
  ]);

  return {
    sourceFileName: toNullableString(normalized.sourceFileName || document.sourceFileName),
    cityAreaName: toNullableString(normalized.cityAreaName),
    milanoSkuTested: toNullableString(normalized.milanoSkuTested),
    cigaretteFilterType: toNullableString(normalized.cigaretteFilterType),
    respondentType: toNullableString(normalized.respondentType),
    respondentAgeGroup: toNullableString(normalized.respondentAgeGroup),
    smokingFrequency: toNullableString(normalized.smokingFrequency),
    drawEffort: toNullableString(normalized.drawEffort),
    smokeVolume: toNullableString(normalized.smokeVolume),
    smokeSmoothness: toNullableString(normalized.smokeSmoothness),
    tasteFlavorFeeling: toNullableString(normalized.tasteFlavorFeeling),
    aftertasteFeeling: toNullableString(normalized.aftertasteFeeling),
    filterComfortFeel: toNullableString(normalized.filterComfortFeel),
    burningSpeed: toNullableString(normalized.burningSpeed),
    ashQualityColor: toNullableString(normalized.ashQualityColor),
    tasteFlavorConsistency: toNullableString(normalized.tasteFlavorConsistency),
    outerPackVisualAppeal: toNullableString(normalized.outerPackVisualAppeal),
    packColourAttractiveness: toNullableString(normalized.packColourAttractiveness),
    packQualityFeelOpeningStrength: toNullableString(
      normalized.packQualityFeelOpeningStrength,
    ),
    priceBlack: toNullableString(normalized.priceValueMilanoOdysseyBlack),
    priceGold: toNullableString(normalized.priceValueMilanoOdysseyGold),
    priceCherry: toNullableString(normalized.priceValueMilanoCherryVintage),
    overallSatisfactionRating: toNullableString(
      normalized.overallSatisfactionRating,
    ),
    mainReasonForRating: toNullableString(normalized.mainReasonForRating),
    wouldBuy: toNullableString(normalized.wouldBuy),
    wouldRecommend: toNullableString(normalized.wouldRecommend),
    likedMost: toNullableString(normalized.likedMost),
    shouldImprove: toNullableString(normalized.shouldImprove),
    brandSmokedMostOften: toNullableString(normalized.brandSmokedMostOften),
    ...(confidenceNotes.length > 0 ? { confidenceNotes } : {}),
    ...(missingFields.length > 0 ? { missingFields } : {}),
  };
}

export function serializeFeedbackRecord(record: Feedback): FeedbackRecord {
  return feedbackRecordSchema.parse({
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    sourceFileName: record.sourceFileName,
    cityAreaName: record.cityAreaName,
    milanoSkuTested: record.milanoSkuTested,
    cigaretteFilterType: record.cigaretteFilterType,
    respondentType: record.respondentType,
    respondentAgeGroup: record.respondentAgeGroup,
    smokingFrequency: record.smokingFrequency,
    drawEffort: record.drawEffort,
    smokeVolume: record.smokeVolume,
    smokeSmoothness: record.smokeSmoothness,
    tasteFlavorFeeling: record.tasteFlavorFeeling,
    aftertasteFeeling: record.aftertasteFeeling,
    filterComfortFeel: record.filterComfortFeel,
    burningSpeed: record.burningSpeed,
    ashQualityColor: record.ashQualityColor,
    tasteFlavorConsistency: record.tasteFlavorConsistency,
    outerPackVisualAppeal: record.outerPackVisualAppeal,
    packColourAttractiveness: record.packColourAttractiveness,
    packQualityFeelOpeningStrength: record.packQualityFeelOpeningStrength,
    priceBlack: record.priceBlack,
    priceGold: record.priceGold,
    priceCherry: record.priceCherry,
    overallSatisfactionRating: record.overallSatisfactionRating,
    mainReasonForRating: record.mainReasonForRating,
    wouldBuy: record.wouldBuy,
    wouldRecommend: record.wouldRecommend,
    likedMost: record.likedMost,
    shouldImprove: record.shouldImprove,
    brandSmokedMostOften: record.brandSmokedMostOften,
    confidenceNotes: parseJsonStringArray(record.confidenceNotes),
    missingFields: parseJsonStringArray(record.missingFields),
  });
}

export function toFeedbackExportRow(record: FeedbackRecord) {
  return {
    "Created At": formatExportDate(record.createdAt),
    "Source File Name": record.sourceFileName ?? "",
    "City / Area Name": record.cityAreaName ?? "",
    "Milano SKU Tested": record.milanoSkuTested ?? "",
    "Cigarette Filter Type": record.cigaretteFilterType ?? "",
    "Respondent Type": record.respondentType ?? "",
    "Respondent Age Group": record.respondentAgeGroup ?? "",
    "Smoking Frequency": record.smokingFrequency ?? "",
    "Draw Effort": record.drawEffort ?? "",
    "Smoke Volume": record.smokeVolume ?? "",
    "Smoke Smoothness": record.smokeSmoothness ?? "",
    "Taste / Flavor Feeling": record.tasteFlavorFeeling ?? "",
    "Aftertaste Feeling": record.aftertasteFeeling ?? "",
    "Filter Comfort Feel": record.filterComfortFeel ?? "",
    "Burning Speed": record.burningSpeed ?? "",
    "Ash Quality / Color": record.ashQualityColor ?? "",
    "Taste / Flavor Consistency": record.tasteFlavorConsistency ?? "",
    "Outer Pack Visual Appeal": record.outerPackVisualAppeal ?? "",
    "Pack Colour Attractiveness": record.packColourAttractiveness ?? "",
    "Pack Quality / Feel / Opening Strength":
      record.packQualityFeelOpeningStrength ?? "",
    "Price Black": record.priceBlack ?? "",
    "Price Gold": record.priceGold ?? "",
    "Price Cherry": record.priceCherry ?? "",
    "Overall Satisfaction Rating": record.overallSatisfactionRating ?? "",
    "Main Reason For Rating": record.mainReasonForRating ?? "",
    "Would Buy": record.wouldBuy ?? "",
    "Would Recommend": record.wouldRecommend ?? "",
    "Liked Most": record.likedMost ?? "",
    "Should Improve": record.shouldImprove ?? "",
    "Brand Smoked Most Often": record.brandSmokedMostOften ?? "",
    "Confidence Notes": record.confidenceNotes.join(" | "),
    "Missing Fields": record.missingFields.join(" | "),
  };
}

function toNullableString(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseJsonStringArray(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function uniqueStrings(values: Array<string | undefined>) {
  return [...new Set(values.map((value) => value?.trim() ?? "").filter(Boolean))];
}

function formatExportDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}
