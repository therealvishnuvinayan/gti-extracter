export const PAGE_EXTRACTION_PROMPT = `
You are extracting one scanned page from a "Consumer Product Testing: Feedback Form" used for GTI demos.

This page may contain:
- printed labels and rating scales
- handwritten answers
- checked or faint checkboxes / radio buttons
- crossed-out or partially marked choices
- blank fields
- skewed, overexposed, or low-contrast scan artifacts

Your job for this single page:
- read only what is visible on this page
- capture printed labels and their visible answers
- identify selected checkbox / radio / rating options when they are visibly marked
- capture handwritten comments and free-text answers
- mark blank answers as blank instead of guessing
- if a mark or handwriting is ambiguous, leave the answer empty and describe the issue in uncertainty or confidenceNotes
- never infer values from other pages or from what "should" be present on the form
- never hallucinate a brand, score, SKU, or comment

Output rules:
- return JSON only
- use the exact schema provided
- transcribedText should preserve meaningful line breaks when possible
- sectionTitle should be the most visible page heading or section name, or an empty string
- pageSummary should briefly explain what this page contains
- extractedItems should list each visible question/field block that has a meaningful label on this page
- for extractedItems.answer, return the direct answer text or selected value when visible
- for extractedItems.selectedOptions, include the visibly selected options for checkbox/radio/rating questions
- for extractedItems.answerType, choose the closest match from the schema
- for extractedItems.evidence, cite a short visual basis such as "checkbox next to Gold is marked" or "handwritten note below comments field"
- for extractedItems.isBlank, use true only when the field is visibly present but not filled
- put ambiguous handwriting, faint ticks, unclear scales, and partial answers into uncertainty and confidenceNotes
- missingOrUnclearFields should mention important page fields that are present but blank, unreadable, or uncertain
`.trim();

export const DOCUMENT_NORMALIZATION_PROMPT = `
You are combining page-level extraction JSON from one GTI "Consumer Product Testing: Feedback Form" into a single strict normalized document.

Important rules:
- use only the supplied page extraction JSON as evidence
- do not invent values that are not clearly supported by the page data
- prefer empty strings over guessing
- if there are conflicting answers across pages, choose the most directly supported value and mention the conflict in confidenceNotes
- preserve the exact wording of comments where reasonably legible
- use strings for ratings and numeric values
- if a value is ambiguous or blank, leave it empty and include the field name in missingOrUnclearFields
- confidenceNotes should be concise, specific, and useful for an operator reviewing the output
- missingOrUnclearFields should use the normalized field names from the schema

Field mapping guidance:
- cityAreaName: city / area / location field
- milanoSkuTested: which Milano SKU or product variant the respondent tested
- cigaretteFilterType: selected filter type
- respondentType: "You are a" field
- respondentAgeGroup: age bracket
- smokingFrequency: smoking frequency question
- drawEffort, smokeVolume, smokeSmoothness, tasteFlavorFeeling, aftertasteFeeling, filterComfortFeel, burningSpeed, ashQualityColor, tasteFlavorConsistency: the product attribute ratings
- outerPackVisualAppeal, packColourAttractiveness, packQualityFeelOpeningStrength: packaging ratings
- priceValueMilanoOdysseyBlack, priceValueMilanoOdysseyGold, priceValueMilanoCherryVintage: price/value-for-money answers for the specific product variants
- overallSatisfactionRating: overall satisfaction score
- mainReasonForRating: reason for the overall rating
- wouldBuy: purchase intent answer
- wouldRecommend: recommendation answer
- likedMost: free-text answer about what was liked most
- shouldImprove: free-text answer about what should be improved
- brandSmokedMostOften: the respondent's most frequently smoked brand

Output rules:
- return JSON only
- use the exact schema provided
- sourceFileName must match the supplied file name
`.trim();

export const PAGE_EXTRACTION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "pageNumber",
    "sectionTitle",
    "pageSummary",
    "transcribedText",
    "extractedItems",
    "confidenceNotes",
    "missingOrUnclearFields",
  ],
  properties: {
    pageNumber: { type: "integer" },
    sectionTitle: { type: "string" },
    pageSummary: { type: "string" },
    transcribedText: { type: "string" },
    extractedItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "label",
          "answer",
          "answerType",
          "selectedOptions",
          "evidence",
          "isBlank",
          "uncertainty",
        ],
        properties: {
          label: { type: "string" },
          answer: { type: "string" },
          answerType: {
            type: "string",
            enum: [
              "text",
              "choice",
              "rating",
              "comment",
              "brand",
              "numeric",
              "unknown",
            ],
          },
          selectedOptions: {
            type: "array",
            items: { type: "string" },
          },
          evidence: { type: "string" },
          isBlank: { type: "boolean" },
          uncertainty: { type: "string" },
        },
      },
    },
    confidenceNotes: {
      type: "array",
      items: { type: "string" },
    },
    missingOrUnclearFields: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

export const DOCUMENT_NORMALIZATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
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
    "confidenceNotes",
    "missingOrUnclearFields",
  ],
  properties: {
    sourceFileName: { type: "string" },
    cityAreaName: { type: "string" },
    milanoSkuTested: { type: "string" },
    cigaretteFilterType: { type: "string" },
    respondentType: { type: "string" },
    respondentAgeGroup: { type: "string" },
    smokingFrequency: { type: "string" },
    drawEffort: { type: "string" },
    smokeVolume: { type: "string" },
    smokeSmoothness: { type: "string" },
    tasteFlavorFeeling: { type: "string" },
    aftertasteFeeling: { type: "string" },
    filterComfortFeel: { type: "string" },
    burningSpeed: { type: "string" },
    ashQualityColor: { type: "string" },
    tasteFlavorConsistency: { type: "string" },
    outerPackVisualAppeal: { type: "string" },
    packColourAttractiveness: { type: "string" },
    packQualityFeelOpeningStrength: { type: "string" },
    priceValueMilanoOdysseyBlack: { type: "string" },
    priceValueMilanoOdysseyGold: { type: "string" },
    priceValueMilanoCherryVintage: { type: "string" },
    overallSatisfactionRating: { type: "string" },
    mainReasonForRating: { type: "string" },
    wouldBuy: { type: "string" },
    wouldRecommend: { type: "string" },
    likedMost: { type: "string" },
    shouldImprove: { type: "string" },
    brandSmokedMostOften: { type: "string" },
    confidenceNotes: {
      type: "array",
      items: { type: "string" },
    },
    missingOrUnclearFields: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;
