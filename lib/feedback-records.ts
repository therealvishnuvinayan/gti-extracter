import "server-only";

import type { Feedback, Prisma } from "@prisma/client";
import { GTI_EXPORT_COLUMNS, GTI_EXPORT_HEADERS } from "@/lib/gti/export-columns";
import {
  finalizeNormalizedFeedbackForm,
  logExportFieldNormalization,
} from "@/lib/gti/finalize";
import { feedbackRecordSchema, type FeedbackRecord, type ProcessedFeedbackDocument } from "@/lib/types";

export { GTI_EXPORT_HEADERS as FEEDBACK_EXPORT_HEADERS };

export function toFeedbackCreateData(
  document: ProcessedFeedbackDocument,
): Prisma.FeedbackCreateInput {
  const normalized = finalizeNormalizedFeedbackForm(document.normalized);
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
    mainReasonForRating: toNullableString(
      joinNormalizedMultiValue(normalized.mainReasonForRating),
    ),
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
  const normalized = finalizeNormalizedFeedbackForm({
    sourceFileName: record.sourceFileName ?? "",
    cityAreaName: record.cityAreaName ?? "",
    milanoSkuTested: record.milanoSkuTested ?? "",
    cigaretteFilterType: record.cigaretteFilterType ?? "",
    respondentType: record.respondentType ?? "",
    respondentAgeGroup: record.respondentAgeGroup ?? "",
    smokingFrequency: record.smokingFrequency ?? "",
    drawEffort: record.drawEffort ?? "",
    smokeVolume: record.smokeVolume ?? "",
    smokeSmoothness: record.smokeSmoothness ?? "",
    tasteFlavorFeeling: record.tasteFlavorFeeling ?? "",
    aftertasteFeeling: record.aftertasteFeeling ?? "",
    filterComfortFeel: record.filterComfortFeel ?? "",
    burningSpeed: record.burningSpeed ?? "",
    ashQualityColor: record.ashQualityColor ?? "",
    tasteFlavorConsistency: record.tasteFlavorConsistency ?? "",
    outerPackVisualAppeal: record.outerPackVisualAppeal ?? "",
    packColourAttractiveness: record.packColourAttractiveness ?? "",
    packQualityFeelOpeningStrength: record.packQualityFeelOpeningStrength ?? "",
    priceValueMilanoOdysseyBlack: record.priceBlack ?? "",
    priceValueMilanoOdysseyGold: record.priceGold ?? "",
    priceValueMilanoCherryVintage: record.priceCherry ?? "",
    overallSatisfactionRating: record.overallSatisfactionRating ?? "",
    mainReasonForRating: splitStoredMultiValue(record.mainReasonForRating),
    wouldBuy: record.wouldBuy ?? "",
    wouldRecommend: record.wouldRecommend ?? "",
    likedMost: record.likedMost ?? "",
    shouldImprove: record.shouldImprove ?? "",
    brandSmokedMostOften: record.brandSmokedMostOften ?? "",
    confidenceNotes: parseJsonStringArray(record.confidenceNotes),
    missingOrUnclearFields: parseJsonStringArray(record.missingFields),
  });

  return feedbackRecordSchema.parse({
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    sourceFileName: toNullableString(normalized.sourceFileName),
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
    overallSatisfactionRating: toNullableString(normalized.overallSatisfactionRating),
    mainReasonForRating: toNullableString(
      joinNormalizedMultiValue(normalized.mainReasonForRating),
    ),
    wouldBuy: toNullableString(normalized.wouldBuy),
    wouldRecommend: toNullableString(normalized.wouldRecommend),
    likedMost: toNullableString(normalized.likedMost),
    shouldImprove: toNullableString(normalized.shouldImprove),
    brandSmokedMostOften: toNullableString(normalized.brandSmokedMostOften),
    confidenceNotes: normalized.confidenceNotes,
    missingFields: normalized.missingOrUnclearFields,
  });
}

export function toFeedbackExportRow(record: FeedbackRecord) {
  const normalized = finalizeNormalizedFeedbackForm({
    sourceFileName: record.sourceFileName ?? "",
    cityAreaName: record.cityAreaName ?? "",
    milanoSkuTested: record.milanoSkuTested ?? "",
    cigaretteFilterType: record.cigaretteFilterType ?? "",
    respondentType: record.respondentType ?? "",
    respondentAgeGroup: record.respondentAgeGroup ?? "",
    smokingFrequency: record.smokingFrequency ?? "",
    drawEffort: record.drawEffort ?? "",
    smokeVolume: record.smokeVolume ?? "",
    smokeSmoothness: record.smokeSmoothness ?? "",
    tasteFlavorFeeling: record.tasteFlavorFeeling ?? "",
    aftertasteFeeling: record.aftertasteFeeling ?? "",
    filterComfortFeel: record.filterComfortFeel ?? "",
    burningSpeed: record.burningSpeed ?? "",
    ashQualityColor: record.ashQualityColor ?? "",
    tasteFlavorConsistency: record.tasteFlavorConsistency ?? "",
    outerPackVisualAppeal: record.outerPackVisualAppeal ?? "",
    packColourAttractiveness: record.packColourAttractiveness ?? "",
    packQualityFeelOpeningStrength: record.packQualityFeelOpeningStrength ?? "",
    priceValueMilanoOdysseyBlack: record.priceBlack ?? "",
    priceValueMilanoOdysseyGold: record.priceGold ?? "",
    priceValueMilanoCherryVintage: record.priceCherry ?? "",
    overallSatisfactionRating: record.overallSatisfactionRating ?? "",
    mainReasonForRating: splitStoredMultiValue(record.mainReasonForRating),
    wouldBuy: record.wouldBuy ?? "",
    wouldRecommend: record.wouldRecommend ?? "",
    likedMost: record.likedMost ?? "",
    shouldImprove: record.shouldImprove ?? "",
    brandSmokedMostOften: record.brandSmokedMostOften ?? "",
  });

  const row = Object.fromEntries(
    GTI_EXPORT_COLUMNS.map(({ fieldKey, header }) => {
      const writtenValue = joinNormalizedMultiValue(normalized[fieldKey]);

      logExportFieldNormalization({
        context: `db-export:${record.id}`,
        fieldKey,
        before: readRecordFieldValue(record, fieldKey),
        after: normalized[fieldKey],
        written: writtenValue,
      });

      return [header, writtenValue];
    }),
  );

  return row;
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

function joinNormalizedMultiValue(value: string | string[]) {
  return Array.isArray(value) ? value.filter(Boolean).join(" | ") : value;
}

function splitStoredMultiValue(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/\s*(?:\||,|;|\n)\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readRecordFieldValue(record: FeedbackRecord, fieldKey: (typeof GTI_EXPORT_COLUMNS)[number]["fieldKey"]) {
  switch (fieldKey) {
    case "sourceFileName":
      return record.sourceFileName ?? "";
    case "cityAreaName":
      return record.cityAreaName ?? "";
    case "milanoSkuTested":
      return record.milanoSkuTested ?? "";
    case "cigaretteFilterType":
      return record.cigaretteFilterType ?? "";
    case "respondentType":
      return record.respondentType ?? "";
    case "respondentAgeGroup":
      return record.respondentAgeGroup ?? "";
    case "smokingFrequency":
      return record.smokingFrequency ?? "";
    case "drawEffort":
      return record.drawEffort ?? "";
    case "smokeVolume":
      return record.smokeVolume ?? "";
    case "smokeSmoothness":
      return record.smokeSmoothness ?? "";
    case "tasteFlavorFeeling":
      return record.tasteFlavorFeeling ?? "";
    case "aftertasteFeeling":
      return record.aftertasteFeeling ?? "";
    case "filterComfortFeel":
      return record.filterComfortFeel ?? "";
    case "burningSpeed":
      return record.burningSpeed ?? "";
    case "ashQualityColor":
      return record.ashQualityColor ?? "";
    case "tasteFlavorConsistency":
      return record.tasteFlavorConsistency ?? "";
    case "outerPackVisualAppeal":
      return record.outerPackVisualAppeal ?? "";
    case "packColourAttractiveness":
      return record.packColourAttractiveness ?? "";
    case "packQualityFeelOpeningStrength":
      return record.packQualityFeelOpeningStrength ?? "";
    case "priceValueMilanoOdysseyBlack":
      return record.priceBlack ?? "";
    case "priceValueMilanoOdysseyGold":
      return record.priceGold ?? "";
    case "priceValueMilanoCherryVintage":
      return record.priceCherry ?? "";
    case "overallSatisfactionRating":
      return record.overallSatisfactionRating ?? "";
    case "mainReasonForRating":
      return record.mainReasonForRating ?? "";
    case "wouldBuy":
      return record.wouldBuy ?? "";
    case "wouldRecommend":
      return record.wouldRecommend ?? "";
    case "likedMost":
      return record.likedMost ?? "";
    case "shouldImprove":
      return record.shouldImprove ?? "";
    case "brandSmokedMostOften":
      return record.brandSmokedMostOften ?? "";
  }
}
