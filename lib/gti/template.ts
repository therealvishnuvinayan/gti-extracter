export const GTI_TEMPLATE_NAME = "CONSUMER PRODUCT TESTING : FEEDBACK FORM";

export const gtiMilanoSkuOptions = [
  "Milano Odyssey Black",
  "Milano Odyssey Gold",
  "Milano Cherry Vintage",
] as const;

export const gtiCigaretteFilterTypeOptions = ["Mono", "Hollow"] as const;

export const gtiRespondentTypeOptions = [
  "Smoker (Consumer)",
  "Retailer",
  "Wholesaler / Semi Wholesaler",
] as const;

export const gtiRespondentAgeGroupOptions = [
  "18 to 30 Years",
  "31 to 45 Years",
  "45 Years above",
] as const;

export const gtiSmokingFrequencyOptions = [
  "(Light) 1 to 5 sticks / day",
  "(Medium) 6 to 10 sticks / day",
  "(Heavy) 10+ sticks / day",
] as const;

export const gtiAshQualityColorOptions = [
  "White and Compact",
  "Acceptable",
  "Dark and Falling",
] as const;

export const gtiPriceValueOptions = [
  "50 AFN",
  "40 AFN",
  "30 AFN",
  "20 AFN",
] as const;

export const gtiScale1To5Values = ["1", "2", "3", "4", "5"] as const;
export const gtiScale1To3Values = ["1", "2", "3"] as const;

export const gtiMainReasonForRatingOptions = [
  "Taste / flavor",
  "Harshness",
  "Good balance",
  "Smoke quantity",
  "Packaging",
  "Price",
  "Brand trust",
] as const;

export const gtiDecisionOptions = ["Yes", "No", "Maybe"] as const;

export const gtiExtractedFieldKeys = [
  "cityAreaName",
  "milanoSkuTested",
  "cigaretteFilterType",
  "respondentType",
  "respondentAgeGroup",
  "brandSmokedMostOften",
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
] as const;

export const gtiStructuredFieldKeys = [
  "sourceFileName",
  "cityAreaName",
  "milanoSkuTested",
  "cigaretteFilterType",
  "respondentType",
  "respondentAgeGroup",
  "brandSmokedMostOften",
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
] as const;

export const gtiFieldKeys = [
  ...gtiStructuredFieldKeys,
  "confidenceNotes",
  "missingOrUnclearFields",
] as const;

export type GtiExtractedFieldKey = (typeof gtiExtractedFieldKeys)[number];
export type GtiStructuredFieldKey = (typeof gtiStructuredFieldKeys)[number];
export type GtiFieldKey = (typeof gtiFieldKeys)[number];

export type GtiFieldType =
  | "free_text"
  | "single_select"
  | "multi_select_max_2"
  | "scale_1_to_5"
  | "scale_1_to_3";

export type GtiFieldDefinition = {
  key: GtiExtractedFieldKey;
  label: string;
  question: string;
  type: GtiFieldType;
  pageNumber: number;
  allowedValues?: readonly string[];
  leftLabel?: string;
  rightLabel?: string;
};

export const gtiFieldLabels: Record<GtiFieldKey, string> = {
  sourceFileName: "Source File Name",
  cityAreaName: "City / Area Name",
  milanoSkuTested: "Milano SKU Tested",
  cigaretteFilterType: "Cigarette Filter Type",
  respondentType: "Respondent Type",
  respondentAgeGroup: "Respondent Age Group",
  brandSmokedMostOften: "Brand Smoked Most Often",
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
  confidenceNotes: "Confidence Notes",
  missingOrUnclearFields: "Missing Or Unclear Fields",
};

export const GTI_FIELD_DEFINITIONS: Record<GtiExtractedFieldKey, GtiFieldDefinition> = {
  cityAreaName: {
    key: "cityAreaName",
    label: gtiFieldLabels.cityAreaName,
    question: "City / Area Name",
    type: "free_text",
    pageNumber: 1,
  },
  milanoSkuTested: {
    key: "milanoSkuTested",
    label: gtiFieldLabels.milanoSkuTested,
    question: "Which Milano SKU did you test? (give only one per person)",
    type: "single_select",
    pageNumber: 1,
    allowedValues: gtiMilanoSkuOptions,
  },
  cigaretteFilterType: {
    key: "cigaretteFilterType",
    label: gtiFieldLabels.cigaretteFilterType,
    question: "Cigarette filter type",
    type: "single_select",
    pageNumber: 1,
    allowedValues: gtiCigaretteFilterTypeOptions,
  },
  respondentType: {
    key: "respondentType",
    label: gtiFieldLabels.respondentType,
    question: "You are a",
    type: "single_select",
    pageNumber: 1,
    allowedValues: gtiRespondentTypeOptions,
  },
  respondentAgeGroup: {
    key: "respondentAgeGroup",
    label: gtiFieldLabels.respondentAgeGroup,
    question: "Respondent age group",
    type: "single_select",
    pageNumber: 2,
    allowedValues: gtiRespondentAgeGroupOptions,
  },
  brandSmokedMostOften: {
    key: "brandSmokedMostOften",
    label: gtiFieldLabels.brandSmokedMostOften,
    question: "Which brand do you smoke most often?",
    type: "free_text",
    pageNumber: 2,
  },
  smokingFrequency: {
    key: "smokingFrequency",
    label: gtiFieldLabels.smokingFrequency,
    question: "How often do you smoke cigarettes?",
    type: "single_select",
    pageNumber: 2,
    allowedValues: gtiSmokingFrequencyOptions,
  },
  drawEffort: {
    key: "drawEffort",
    label: gtiFieldLabels.drawEffort,
    question: "SMOKING EXPERIENCE - Draw Effort (How easy it is to puff)",
    type: "scale_1_to_5",
    pageNumber: 2,
    allowedValues: gtiScale1To5Values,
    leftLabel: "Very Easy",
    rightLabel: "Very Hard",
  },
  smokeVolume: {
    key: "smokeVolume",
    label: gtiFieldLabels.smokeVolume,
    question: "SMOKING EXPERIENCE - Smoke Volume (mouth fullness)",
    type: "scale_1_to_5",
    pageNumber: 2,
    allowedValues: gtiScale1To5Values,
    leftLabel: "Very Low",
    rightLabel: "Very High",
  },
  smokeSmoothness: {
    key: "smokeSmoothness",
    label: gtiFieldLabels.smokeSmoothness,
    question: "SMOKING EXPERIENCE - Smoke Smoothness",
    type: "scale_1_to_5",
    pageNumber: 2,
    allowedValues: gtiScale1To5Values,
    leftLabel: "Very Poor",
    rightLabel: "Excellent",
  },
  tasteFlavorFeeling: {
    key: "tasteFlavorFeeling",
    label: gtiFieldLabels.tasteFlavorFeeling,
    question: "SMOKING EXPERIENCE - Taste & Flavor feeling",
    type: "scale_1_to_5",
    pageNumber: 2,
    allowedValues: gtiScale1To5Values,
    leftLabel: "Very Poor",
    rightLabel: "Excellent",
  },
  aftertasteFeeling: {
    key: "aftertasteFeeling",
    label: gtiFieldLabels.aftertasteFeeling,
    question: "SMOKING EXPERIENCE - Aftertaste feeling",
    type: "scale_1_to_5",
    pageNumber: 3,
    allowedValues: gtiScale1To5Values,
    leftLabel: "Very Poor",
    rightLabel: "Excellent",
  },
  filterComfortFeel: {
    key: "filterComfortFeel",
    label: gtiFieldLabels.filterComfortFeel,
    question:
      "PRODUCT ATTRIBUTES - How well did the filter feel while smoking (comfort and feel while smoking)?",
    type: "scale_1_to_5",
    pageNumber: 3,
    allowedValues: gtiScale1To5Values,
    leftLabel: "Very Poor",
    rightLabel: "Excellent",
  },
  burningSpeed: {
    key: "burningSpeed",
    label: gtiFieldLabels.burningSpeed,
    question: "PRODUCT ATTRIBUTES - How was the burning speed of the cigarette?",
    type: "scale_1_to_5",
    pageNumber: 3,
    allowedValues: gtiScale1To5Values,
    leftLabel: "Very Fast",
    rightLabel: "Very Slow",
  },
  ashQualityColor: {
    key: "ashQualityColor",
    label: gtiFieldLabels.ashQualityColor,
    question: "PRODUCT ATTRIBUTES - ash quality and color",
    type: "single_select",
    pageNumber: 3,
    allowedValues: gtiAshQualityColorOptions,
  },
  tasteFlavorConsistency: {
    key: "tasteFlavorConsistency",
    label: gtiFieldLabels.tasteFlavorConsistency,
    question: "PRODUCT ATTRIBUTES - Smoking taste & flavor consistency of sticks",
    type: "scale_1_to_3",
    pageNumber: 3,
    allowedValues: gtiScale1To3Values,
    leftLabel: "Inconsistent",
    rightLabel: "Totally Consistent",
  },
  outerPackVisualAppeal: {
    key: "outerPackVisualAppeal",
    label: gtiFieldLabels.outerPackVisualAppeal,
    question: "PACKAGING - Overall outer pack visual appeal",
    type: "scale_1_to_5",
    pageNumber: 3,
    allowedValues: gtiScale1To5Values,
    leftLabel: "Very Poor",
    rightLabel: "Excellent",
  },
  packColourAttractiveness: {
    key: "packColourAttractiveness",
    label: gtiFieldLabels.packColourAttractiveness,
    question: "PACKAGING - Pack colour attractiveness",
    type: "scale_1_to_5",
    pageNumber: 4,
    allowedValues: gtiScale1To5Values,
    leftLabel: "Very Poor",
    rightLabel: "Excellent",
  },
  packQualityFeelOpeningStrength: {
    key: "packQualityFeelOpeningStrength",
    label: gtiFieldLabels.packQualityFeelOpeningStrength,
    question: "PACKAGING - Pack quality (feel, opening, sturdiness)",
    type: "scale_1_to_5",
    pageNumber: 4,
    allowedValues: gtiScale1To5Values,
    leftLabel: "Very Poor",
    rightLabel: "Excellent",
  },
  priceValueMilanoOdysseyBlack: {
    key: "priceValueMilanoOdysseyBlack",
    label: gtiFieldLabels.priceValueMilanoOdysseyBlack,
    question:
      "Which price you feel this product is good value for money - Milano Odyssey Black?",
    type: "single_select",
    pageNumber: 4,
    allowedValues: gtiPriceValueOptions,
  },
  priceValueMilanoOdysseyGold: {
    key: "priceValueMilanoOdysseyGold",
    label: gtiFieldLabels.priceValueMilanoOdysseyGold,
    question:
      "Which price you feel this product is good value for money - Milano Odyssey Gold?",
    type: "single_select",
    pageNumber: 4,
    allowedValues: gtiPriceValueOptions,
  },
  priceValueMilanoCherryVintage: {
    key: "priceValueMilanoCherryVintage",
    label: gtiFieldLabels.priceValueMilanoCherryVintage,
    question:
      "Which price you feel this product is good value for money - Milano Cherry Vintage?",
    type: "single_select",
    pageNumber: 4,
    allowedValues: gtiPriceValueOptions,
  },
  overallSatisfactionRating: {
    key: "overallSatisfactionRating",
    label: gtiFieldLabels.overallSatisfactionRating,
    question: "Overall satisfaction rating",
    type: "scale_1_to_5",
    pageNumber: 5,
    allowedValues: gtiScale1To5Values,
  },
  mainReasonForRating: {
    key: "mainReasonForRating",
    label: gtiFieldLabels.mainReasonForRating,
    question: "Main reason for your rating (select up to 2 factors only)",
    type: "multi_select_max_2",
    pageNumber: 5,
    allowedValues: gtiMainReasonForRatingOptions,
  },
  wouldBuy: {
    key: "wouldBuy",
    label: gtiFieldLabels.wouldBuy,
    question: "Would you buy this product?",
    type: "single_select",
    pageNumber: 5,
    allowedValues: gtiDecisionOptions,
  },
  wouldRecommend: {
    key: "wouldRecommend",
    label: gtiFieldLabels.wouldRecommend,
    question: "Would you recommend it to others?",
    type: "single_select",
    pageNumber: 5,
    allowedValues: gtiDecisionOptions,
  },
  likedMost: {
    key: "likedMost",
    label: gtiFieldLabels.likedMost,
    question: "COMMENTS - What did you like most?",
    type: "free_text",
    pageNumber: 5,
  },
  shouldImprove: {
    key: "shouldImprove",
    label: gtiFieldLabels.shouldImprove,
    question: "COMMENTS - What should be improved?",
    type: "free_text",
    pageNumber: 5,
  },
};

export function getGtiFieldDefinition(fieldKey: GtiExtractedFieldKey) {
  return GTI_FIELD_DEFINITIONS[fieldKey];
}
