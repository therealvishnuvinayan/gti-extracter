import {
  GTI_FIELD_DEFINITIONS,
  type GtiExtractedFieldKey,
  type GtiFieldDefinition,
} from "@/lib/gti/template";

export type NormalizedCropRegion = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type GtiTemplateField = GtiFieldDefinition & {
  groupId: string;
  extractionStrategy: GtiFieldDefinition["type"];
  region: NormalizedCropRegion;
  promptHint: string;
};

export type GtiFieldGroupDefinition = {
  id: string;
  pageNumber: number;
  label: string;
  description: string;
  region: NormalizedCropRegion;
  fieldKeys: GtiExtractedFieldKey[];
};

const withFieldMeta = (
  fieldKey: GtiExtractedFieldKey,
  config: Omit<GtiTemplateField, keyof GtiFieldDefinition>,
): GtiTemplateField => ({
  ...GTI_FIELD_DEFINITIONS[fieldKey],
  ...config,
});

export const GTI_TEMPLATE_FIELDS: Record<GtiExtractedFieldKey, GtiTemplateField> = {
  cityAreaName: withFieldMeta("cityAreaName", {
    groupId: "page1_identity",
    extractionStrategy: "free_text",
    region: {
      left: 0.06,
      top: 0.08,
      width: 0.88,
      height: 0.1,
    },
    promptHint:
      "Read only the handwritten or typed location value entered on the answer line.",
  }),
  milanoSkuTested: withFieldMeta("milanoSkuTested", {
    groupId: "page1_product",
    extractionStrategy: "single_select",
    region: {
      left: 0.06,
      top: 0.18,
      width: 0.88,
      height: 0.12,
    },
    promptHint:
      "Look for the marked option in the Milano SKU choice row. Ignore unmarked printed options.",
  }),
  cigaretteFilterType: withFieldMeta("cigaretteFilterType", {
    groupId: "page1_product",
    extractionStrategy: "single_select",
    region: {
      left: 0.06,
      top: 0.3,
      width: 0.88,
      height: 0.1,
    },
    promptHint:
      "Identify the selected filter type based on the visible mark nearest the option.",
  }),
  respondentType: withFieldMeta("respondentType", {
    groupId: "page1_role",
    extractionStrategy: "single_select",
    region: {
      left: 0.06,
      top: 0.4,
      width: 0.88,
      height: 0.14,
    },
    promptHint:
      "Return only the selected respondent type from the role options.",
  }),
  respondentAgeGroup: withFieldMeta("respondentAgeGroup", {
    groupId: "page2_profile",
    extractionStrategy: "single_select",
    region: {
      left: 0.07,
      top: 0.08,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Check only the age-group options and return the one with the nearest human mark.",
  }),
  brandSmokedMostOften: withFieldMeta("brandSmokedMostOften", {
    groupId: "page2_profile",
    extractionStrategy: "free_text",
    region: {
      left: 0.07,
      top: 0.16,
      width: 0.86,
      height: 0.1,
    },
    promptHint:
      "Transcribe only the handwritten brand answer written in the answer area.",
  }),
  smokingFrequency: withFieldMeta("smokingFrequency", {
    groupId: "page2_profile",
    extractionStrategy: "single_select",
    region: {
      left: 0.07,
      top: 0.25,
      width: 0.86,
      height: 0.11,
    },
    promptHint:
      "Identify which smoking-frequency option is selected. Ignore the printed option labels unless marked.",
  }),
  drawEffort: withFieldMeta("drawEffort", {
    groupId: "page2_ratings",
    extractionStrategy: "scale_1_to_5",
    region: {
      left: 0.07,
      top: 0.36,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Return only the chosen 1 to 5 mark in the Draw Effort row.",
  }),
  smokeVolume: withFieldMeta("smokeVolume", {
    groupId: "page2_ratings",
    extractionStrategy: "scale_1_to_5",
    region: {
      left: 0.07,
      top: 0.45,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Return only the chosen 1 to 5 mark in the Smoke Volume row.",
  }),
  smokeSmoothness: withFieldMeta("smokeSmoothness", {
    groupId: "page2_ratings",
    extractionStrategy: "scale_1_to_5",
    region: {
      left: 0.07,
      top: 0.54,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Return only the chosen 1 to 5 mark in the Smoke Smoothness row.",
  }),
  tasteFlavorFeeling: withFieldMeta("tasteFlavorFeeling", {
    groupId: "page2_ratings",
    extractionStrategy: "scale_1_to_5",
    region: {
      left: 0.07,
      top: 0.63,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Return only the chosen 1 to 5 mark in the Taste and Flavor row.",
  }),
  aftertasteFeeling: withFieldMeta("aftertasteFeeling", {
    groupId: "page3_ratings",
    extractionStrategy: "scale_1_to_5",
    region: {
      left: 0.07,
      top: 0.1,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Return only the chosen 1 to 5 mark in the Aftertaste row.",
  }),
  filterComfortFeel: withFieldMeta("filterComfortFeel", {
    groupId: "page3_ratings",
    extractionStrategy: "scale_1_to_5",
    region: {
      left: 0.07,
      top: 0.2,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Return only the chosen 1 to 5 mark in the Filter Comfort row.",
  }),
  burningSpeed: withFieldMeta("burningSpeed", {
    groupId: "page3_ratings",
    extractionStrategy: "scale_1_to_5",
    region: {
      left: 0.07,
      top: 0.3,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Return only the chosen 1 to 5 mark in the Burning Speed row.",
  }),
  ashQualityColor: withFieldMeta("ashQualityColor", {
    groupId: "page3_attributes",
    extractionStrategy: "single_select",
    region: {
      left: 0.07,
      top: 0.4,
      width: 0.86,
      height: 0.1,
    },
    promptHint:
      "Identify the single selected ash quality option based on the visible pen mark.",
  }),
  tasteFlavorConsistency: withFieldMeta("tasteFlavorConsistency", {
    groupId: "page3_attributes",
    extractionStrategy: "scale_1_to_3",
    region: {
      left: 0.07,
      top: 0.52,
      width: 0.86,
      height: 0.1,
    },
    promptHint:
      "Return only the chosen 1 to 3 mark in the Taste and Flavor Consistency row.",
  }),
  outerPackVisualAppeal: withFieldMeta("outerPackVisualAppeal", {
    groupId: "page3_attributes",
    extractionStrategy: "scale_1_to_5",
    region: {
      left: 0.07,
      top: 0.64,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Return only the chosen 1 to 5 mark in the Outer Pack Visual Appeal row.",
  }),
  packColourAttractiveness: withFieldMeta("packColourAttractiveness", {
    groupId: "page4_packaging",
    extractionStrategy: "scale_1_to_5",
    region: {
      left: 0.07,
      top: 0.1,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Return only the chosen 1 to 5 mark in the Pack Colour Attractiveness row.",
  }),
  packQualityFeelOpeningStrength: withFieldMeta(
    "packQualityFeelOpeningStrength",
    {
      groupId: "page4_packaging",
      extractionStrategy: "scale_1_to_5",
      region: {
        left: 0.07,
        top: 0.2,
        width: 0.86,
        height: 0.09,
      },
      promptHint:
        "Return only the chosen 1 to 5 mark in the Pack Quality row.",
    },
  ),
  priceValueMilanoOdysseyBlack: withFieldMeta("priceValueMilanoOdysseyBlack", {
    groupId: "page4_value",
    extractionStrategy: "single_select",
    region: {
      left: 0.07,
      top: 0.39,
      width: 0.86,
      height: 0.11,
    },
    promptHint:
      "Look only at the Milano Odyssey Black price row and return the selected price if any.",
  }),
  priceValueMilanoOdysseyGold: withFieldMeta("priceValueMilanoOdysseyGold", {
    groupId: "page4_value",
    extractionStrategy: "single_select",
    region: {
      left: 0.07,
      top: 0.51,
      width: 0.86,
      height: 0.11,
    },
    promptHint:
      "Look only at the Milano Odyssey Gold price row and return the selected price if any.",
  }),
  priceValueMilanoCherryVintage: withFieldMeta(
    "priceValueMilanoCherryVintage",
    {
      groupId: "page4_value",
      extractionStrategy: "single_select",
      region: {
        left: 0.07,
        top: 0.63,
        width: 0.86,
        height: 0.11,
      },
      promptHint:
        "Look only at the Milano Cherry Vintage price row and return the selected price if any.",
    },
  ),
  overallSatisfactionRating: withFieldMeta("overallSatisfactionRating", {
    groupId: "page5_decisions",
    extractionStrategy: "scale_1_to_5",
    region: {
      left: 0.07,
      top: 0.1,
      width: 0.86,
      height: 0.1,
    },
    promptHint:
      "Return only the chosen 1 to 5 mark in the Overall Satisfaction row, or blank if no mark exists.",
  }),
  mainReasonForRating: withFieldMeta("mainReasonForRating", {
    groupId: "page5_decisions",
    extractionStrategy: "multi_select_max_2",
    region: {
      left: 0.07,
      top: 0.22,
      width: 0.86,
      height: 0.14,
    },
    promptHint:
      "Return up to two selected reason options only. Selection depends on the visible human mark nearest each option.",
  }),
  wouldBuy: withFieldMeta("wouldBuy", {
    groupId: "page5_decisions",
    extractionStrategy: "single_select",
    region: {
      left: 0.07,
      top: 0.38,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Return only the selected option for Would Buy. If none is marked, return blank.",
  }),
  wouldRecommend: withFieldMeta("wouldRecommend", {
    groupId: "page5_decisions",
    extractionStrategy: "single_select",
    region: {
      left: 0.07,
      top: 0.48,
      width: 0.86,
      height: 0.09,
    },
    promptHint:
      "Return only the selected option for Would Recommend. If none is marked, return blank.",
  }),
  likedMost: withFieldMeta("likedMost", {
    groupId: "page5_comments",
    extractionStrategy: "free_text",
    region: {
      left: 0.07,
      top: 0.62,
      width: 0.86,
      height: 0.11,
    },
    promptHint:
      "Transcribe only the handwritten answer written in the What did you like most area.",
  }),
  shouldImprove: withFieldMeta("shouldImprove", {
    groupId: "page5_comments",
    extractionStrategy: "free_text",
    region: {
      left: 0.07,
      top: 0.75,
      width: 0.86,
      height: 0.11,
    },
    promptHint:
      "Transcribe only the handwritten answer written in the What should be improved area.",
  }),
};

export const GTI_FIELD_GROUPS: readonly GtiFieldGroupDefinition[] = [
  {
    id: "page1_identity",
    pageNumber: 1,
    label: "Page 1 identity",
    description: "Location answer line.",
    region: {
      left: 0.05,
      top: 0.07,
      width: 0.9,
      height: 0.13,
    },
    fieldKeys: ["cityAreaName"],
  },
  {
    id: "page1_product",
    pageNumber: 1,
    label: "Page 1 product choice",
    description: "Milano SKU and filter type selections.",
    region: {
      left: 0.05,
      top: 0.17,
      width: 0.9,
      height: 0.24,
    },
    fieldKeys: ["milanoSkuTested", "cigaretteFilterType"],
  },
  {
    id: "page1_role",
    pageNumber: 1,
    label: "Page 1 respondent role",
    description: "Respondent type selection.",
    region: {
      left: 0.05,
      top: 0.38,
      width: 0.9,
      height: 0.18,
    },
    fieldKeys: ["respondentType"],
  },
  {
    id: "page2_profile",
    pageNumber: 2,
    label: "Page 2 profile",
    description: "Age group, brand, and smoking frequency.",
    region: {
      left: 0.05,
      top: 0.07,
      width: 0.9,
      height: 0.31,
    },
    fieldKeys: [
      "respondentAgeGroup",
      "brandSmokedMostOften",
      "smokingFrequency",
    ],
  },
  {
    id: "page2_ratings",
    pageNumber: 2,
    label: "Page 2 ratings",
    description: "Smoking experience rating rows.",
    region: {
      left: 0.05,
      top: 0.34,
      width: 0.9,
      height: 0.41,
    },
    fieldKeys: [
      "drawEffort",
      "smokeVolume",
      "smokeSmoothness",
      "tasteFlavorFeeling",
    ],
  },
  {
    id: "page3_ratings",
    pageNumber: 3,
    label: "Page 3 product ratings",
    description: "Aftertaste, filter comfort, and burning speed rows.",
    region: {
      left: 0.05,
      top: 0.08,
      width: 0.9,
      height: 0.33,
    },
    fieldKeys: ["aftertasteFeeling", "filterComfortFeel", "burningSpeed"],
  },
  {
    id: "page3_attributes",
    pageNumber: 3,
    label: "Page 3 attributes",
    description: "Ash quality, taste consistency, and pack appeal.",
    region: {
      left: 0.05,
      top: 0.39,
      width: 0.9,
      height: 0.38,
    },
    fieldKeys: [
      "ashQualityColor",
      "tasteFlavorConsistency",
      "outerPackVisualAppeal",
    ],
  },
  {
    id: "page4_packaging",
    pageNumber: 4,
    label: "Page 4 packaging",
    description: "Packaging rating rows.",
    region: {
      left: 0.05,
      top: 0.08,
      width: 0.9,
      height: 0.23,
    },
    fieldKeys: ["packColourAttractiveness", "packQualityFeelOpeningStrength"],
  },
  {
    id: "page4_value",
    pageNumber: 4,
    label: "Page 4 value",
    description: "Price selection rows for each Milano variant.",
    region: {
      left: 0.05,
      top: 0.36,
      width: 0.9,
      height: 0.42,
    },
    fieldKeys: [
      "priceValueMilanoOdysseyBlack",
      "priceValueMilanoOdysseyGold",
      "priceValueMilanoCherryVintage",
    ],
  },
  {
    id: "page5_decisions",
    pageNumber: 5,
    label: "Page 5 decision fields",
    description: "Overall rating, reasons, and purchase intent questions.",
    region: {
      left: 0.05,
      top: 0.08,
      width: 0.9,
      height: 0.52,
    },
    fieldKeys: [
      "overallSatisfactionRating",
      "mainReasonForRating",
      "wouldBuy",
      "wouldRecommend",
    ],
  },
  {
    id: "page5_comments",
    pageNumber: 5,
    label: "Page 5 comments",
    description: "Open comment areas.",
    region: {
      left: 0.05,
      top: 0.6,
      width: 0.9,
      height: 0.29,
    },
    fieldKeys: ["likedMost", "shouldImprove"],
  },
] as const;

export function getTemplateField(fieldKey: GtiExtractedFieldKey) {
  return GTI_TEMPLATE_FIELDS[fieldKey];
}

export function getFieldGroupsForPage(pageNumber: number) {
  return GTI_FIELD_GROUPS.filter((group) => group.pageNumber === pageNumber);
}

export function getFieldGroup(groupId: string) {
  return GTI_FIELD_GROUPS.find((group) => group.id === groupId) ?? null;
}
