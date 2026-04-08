import type { NormalizedFeedbackScalarFieldKey } from "@/lib/types";

export type FeedbackFieldGroup = {
  id: string;
  title: string;
  description: string;
  fields: NormalizedFeedbackScalarFieldKey[];
};

export const feedbackFieldGroups: FeedbackFieldGroup[] = [
  {
    id: "respondent",
    title: "Respondent profile",
    description: "Identity, location, and smoking-habit fields captured from the form.",
    fields: [
      "sourceFileName",
      "cityAreaName",
      "respondentType",
      "respondentAgeGroup",
      "smokingFrequency",
      "brandSmokedMostOften",
    ],
  },
  {
    id: "setup",
    title: "Product setup",
    description: "Product variant and respondent setup information.",
    fields: [
      "milanoSkuTested",
      "cigaretteFilterType",
      "wouldBuy",
      "wouldRecommend",
      "overallSatisfactionRating",
      "mainReasonForRating",
    ],
  },
  {
    id: "ratings",
    title: "Product ratings",
    description: "Core product attribute ratings collected in the form.",
    fields: [
      "drawEffort",
      "smokeVolume",
      "smokeSmoothness",
      "tasteFlavorFeeling",
      "aftertasteFeeling",
      "filterComfortFeel",
      "burningSpeed",
      "ashQualityColor",
      "tasteFlavorConsistency",
    ],
  },
  {
    id: "pack-value",
    title: "Pack and value",
    description: "Packaging and value-for-money answers.",
    fields: [
      "outerPackVisualAppeal",
      "packColourAttractiveness",
      "packQualityFeelOpeningStrength",
      "priceValueMilanoOdysseyBlack",
      "priceValueMilanoOdysseyGold",
      "priceValueMilanoCherryVintage",
    ],
  },
  {
    id: "comments",
    title: "Open comments",
    description: "Free-text commentary from the respondent.",
    fields: ["likedMost", "shouldImprove"],
  },
];

export const compactLongTextFieldKeys = new Set<NormalizedFeedbackScalarFieldKey>([
  "mainReasonForRating",
  "likedMost",
  "shouldImprove",
]);
