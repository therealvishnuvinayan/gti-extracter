import { gtiFieldLabels, type GtiStructuredFieldKey } from "@/lib/gti/template";

export const GTI_EXPORT_FIELD_KEYS = [
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
] as const satisfies readonly GtiStructuredFieldKey[];

export const GTI_EXPORT_HEADERS = GTI_EXPORT_FIELD_KEYS.map(
  (fieldKey) => gtiFieldLabels[fieldKey],
) as readonly string[];

export const GTI_EXPORT_COLUMNS = GTI_EXPORT_FIELD_KEYS.map((fieldKey) => ({
  fieldKey,
  header: gtiFieldLabels[fieldKey],
}));

export type GtiExportFieldKey = (typeof GTI_EXPORT_FIELD_KEYS)[number];
