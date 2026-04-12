import type { GtiExtractedFieldKey } from "@/lib/gti/template";

export type GtiPageCropRegion = {
  id: string;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type GtiPageConfig = {
  pageNumber: number;
  title: string;
  description: string;
  fieldKeys: GtiExtractedFieldKey[];
  zoomRegions: GtiPageCropRegion[];
};

export const GTI_PAGE_CONFIGS: readonly GtiPageConfig[] = [
  {
    pageNumber: 1,
    title: "Respondent setup",
    description: "Location, tested SKU, filter type, and respondent role.",
    fieldKeys: [
      "cityAreaName",
      "milanoSkuTested",
      "cigaretteFilterType",
      "respondentType",
    ],
    zoomRegions: [
      {
        id: "page1-header",
        label: "Location and product selection",
        left: 0.06,
        top: 0.08,
        width: 0.88,
        height: 0.3,
      },
      {
        id: "page1-role",
        label: "Filter type and respondent role",
        left: 0.06,
        top: 0.26,
        width: 0.88,
        height: 0.34,
      },
    ],
  },
  {
    pageNumber: 2,
    title: "Respondent profile and smoking experience",
    description: "Age, preferred brand, smoking frequency, and first rating block.",
    fieldKeys: [
      "respondentAgeGroup",
      "brandSmokedMostOften",
      "smokingFrequency",
      "drawEffort",
      "smokeVolume",
      "smokeSmoothness",
      "tasteFlavorFeeling",
    ],
    zoomRegions: [
      {
        id: "page2-profile",
        label: "Age, brand, and smoking frequency",
        left: 0.05,
        top: 0.08,
        width: 0.9,
        height: 0.28,
      },
      {
        id: "page2-ratings",
        label: "Smoking experience ratings",
        left: 0.05,
        top: 0.28,
        width: 0.9,
        height: 0.5,
      },
    ],
  },
  {
    pageNumber: 3,
    title: "Product attributes",
    description: "Aftertaste, filter, burn, ash, consistency, and outer pack appeal.",
    fieldKeys: [
      "aftertasteFeeling",
      "filterComfortFeel",
      "burningSpeed",
      "ashQualityColor",
      "tasteFlavorConsistency",
      "outerPackVisualAppeal",
    ],
    zoomRegions: [
      {
        id: "page3-top",
        label: "Smoking experience and product attributes",
        left: 0.05,
        top: 0.08,
        width: 0.9,
        height: 0.42,
      },
      {
        id: "page3-bottom",
        label: "Consistency and packaging appeal section",
        left: 0.05,
        top: 0.44,
        width: 0.9,
        height: 0.34,
      },
    ],
  },
  {
    pageNumber: 4,
    title: "Packaging and value",
    description: "Packaging scores and price-for-value choices.",
    fieldKeys: [
      "packColourAttractiveness",
      "packQualityFeelOpeningStrength",
      "priceValueMilanoOdysseyBlack",
      "priceValueMilanoOdysseyGold",
      "priceValueMilanoCherryVintage",
    ],
    zoomRegions: [
      {
        id: "page4-packaging",
        label: "Packaging ratings",
        left: 0.05,
        top: 0.08,
        width: 0.9,
        height: 0.34,
      },
      {
        id: "page4-pricing",
        label: "Price and value matrix",
        left: 0.05,
        top: 0.36,
        width: 0.9,
        height: 0.42,
      },
    ],
  },
  {
    pageNumber: 5,
    title: "Overall feedback",
    description: "Overall rating, reasons, intent, and open comments.",
    fieldKeys: [
      "overallSatisfactionRating",
      "mainReasonForRating",
      "wouldBuy",
      "wouldRecommend",
      "likedMost",
      "shouldImprove",
    ],
    zoomRegions: [
      {
        id: "page5-top",
        label: "Overall satisfaction, reason, and intent",
        left: 0.05,
        top: 0.08,
        width: 0.9,
        height: 0.42,
      },
      {
        id: "page5-comments",
        label: "Open comments section",
        left: 0.05,
        top: 0.48,
        width: 0.9,
        height: 0.34,
      },
    ],
  },
] as const;

export const GTI_EXPECTED_PAGE_COUNT = GTI_PAGE_CONFIGS.length;

export function getGtiPageConfig(pageNumber: number) {
  return GTI_PAGE_CONFIGS.find((page) => page.pageNumber === pageNumber) ?? null;
}
