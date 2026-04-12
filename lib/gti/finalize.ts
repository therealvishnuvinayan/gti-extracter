import {
  createEmptyNormalizedFeedbackForm,
  normalizedFeedbackFormSchema,
  sanitizeMissingFieldKeys,
  type NormalizedFeedbackForm,
} from "@/lib/gti/schema";
import {
  gtiAshQualityColorOptions,
  gtiCigaretteFilterTypeOptions,
  gtiDecisionOptions,
  gtiMainReasonForRatingOptions,
  gtiMilanoSkuOptions,
  gtiPriceValueOptions,
  gtiRespondentAgeGroupOptions,
  gtiRespondentTypeOptions,
  gtiScale1To3Values,
  gtiScale1To5Values,
  gtiSmokingFrequencyOptions,
  type GtiExtractedFieldKey,
  type GtiStructuredFieldKey,
} from "@/lib/gti/template";
import {
  GTI_FREE_TEXT_FIELD_KEYS,
  normalizeFreeTextWhitespace,
  normalizeGtiFreeTextField,
} from "@/lib/gti/normalize-text";

export const GTI_SINGLE_SELECT_FIELD_KEYS = [
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
  "wouldBuy",
  "wouldRecommend",
] as const satisfies readonly GtiExtractedFieldKey[];

type GtiSingleSelectFieldKey = (typeof GTI_SINGLE_SELECT_FIELD_KEYS)[number];
type SingleSelectNormalizedValue<K extends GtiSingleSelectFieldKey> =
  | (typeof SINGLE_SELECT_OPTIONS_BY_FIELD)[K][number]
  | "";

const SINGLE_SELECT_FIELD_KEY_SET = new Set<GtiExtractedFieldKey>(
  GTI_SINGLE_SELECT_FIELD_KEYS,
);
const FREE_TEXT_FIELD_KEY_SET = new Set<GtiStructuredFieldKey>(
  GTI_FREE_TEXT_FIELD_KEYS as readonly GtiStructuredFieldKey[],
);

const SINGLE_SELECT_OPTIONS_BY_FIELD: Record<GtiSingleSelectFieldKey, readonly string[]> = {
  milanoSkuTested: gtiMilanoSkuOptions,
  cigaretteFilterType: gtiCigaretteFilterTypeOptions,
  respondentType: gtiRespondentTypeOptions,
  respondentAgeGroup: gtiRespondentAgeGroupOptions,
  smokingFrequency: gtiSmokingFrequencyOptions,
  drawEffort: gtiScale1To5Values,
  smokeVolume: gtiScale1To5Values,
  smokeSmoothness: gtiScale1To5Values,
  tasteFlavorFeeling: gtiScale1To5Values,
  aftertasteFeeling: gtiScale1To5Values,
  filterComfortFeel: gtiScale1To5Values,
  burningSpeed: gtiScale1To5Values,
  ashQualityColor: gtiAshQualityColorOptions,
  tasteFlavorConsistency: gtiScale1To3Values,
  outerPackVisualAppeal: gtiScale1To5Values,
  packColourAttractiveness: gtiScale1To5Values,
  packQualityFeelOpeningStrength: gtiScale1To5Values,
  priceValueMilanoOdysseyBlack: gtiPriceValueOptions,
  priceValueMilanoOdysseyGold: gtiPriceValueOptions,
  priceValueMilanoCherryVintage: gtiPriceValueOptions,
  overallSatisfactionRating: gtiScale1To5Values,
  wouldBuy: gtiDecisionOptions,
  wouldRecommend: gtiDecisionOptions,
};

const SINGLE_SELECT_ALIASES: Partial<Record<GtiSingleSelectFieldKey, Record<string, string>>> =
  {
    milanoSkuTested: {
      milanoodysseyblack: "Milano Odyssey Black",
      milanoodysseygold: "Milano Odyssey Gold",
      milanocherryvintage: "Milano Cherry Vintage",
      black: "Milano Odyssey Black",
      gold: "Milano Odyssey Gold",
      cherry: "Milano Cherry Vintage",
      cherryvintage: "Milano Cherry Vintage",
    },
    cigaretteFilterType: {
      mono: "Mono",
      hollow: "Hollow",
    },
    respondentType: {
      smoker: "Smoker (Consumer)",
      consumer: "Smoker (Consumer)",
      smokerconsumer: "Smoker (Consumer)",
      retailer: "Retailer",
      wholesaler: "Wholesaler / Semi Wholesaler",
      semiwholesaler: "Wholesaler / Semi Wholesaler",
      wholesalersemiwholesaler: "Wholesaler / Semi Wholesaler",
    },
    respondentAgeGroup: {
      "18to30": "18 to 30 Years",
      "18to30years": "18 to 30 Years",
      "31to45": "31 to 45 Years",
      "31to45years": "31 to 45 Years",
      "45above": "45 Years above",
      "45yearsabove": "45 Years above",
    },
    smokingFrequency: {
      light: "(Light) 1 to 5 sticks / day",
      "1to5": "(Light) 1 to 5 sticks / day",
      "1to5sticksday": "(Light) 1 to 5 sticks / day",
      medium: "(Medium) 6 to 10 sticks / day",
      "6to10": "(Medium) 6 to 10 sticks / day",
      "6to10sticksday": "(Medium) 6 to 10 sticks / day",
      heavy: "(Heavy) 10+ sticks / day",
      "10+": "(Heavy) 10+ sticks / day",
      "10sticksday": "(Heavy) 10+ sticks / day",
    },
    ashQualityColor: {
      whitecompact: "White and Compact",
      acceptable: "Acceptable",
      darkfalling: "Dark and Falling",
    },
    priceValueMilanoOdysseyBlack: {
      "50": "50 AFN",
      "40": "40 AFN",
      "30": "30 AFN",
      "20": "20 AFN",
    },
    priceValueMilanoOdysseyGold: {
      "50": "50 AFN",
      "40": "40 AFN",
      "30": "30 AFN",
      "20": "20 AFN",
    },
    priceValueMilanoCherryVintage: {
      "50": "50 AFN",
      "40": "40 AFN",
      "30": "30 AFN",
      "20": "20 AFN",
    },
    wouldBuy: {
      yes: "Yes",
      no: "No",
      maybe: "Maybe",
    },
    wouldRecommend: {
      yes: "Yes",
      no: "No",
      maybe: "Maybe",
    },
  };

const EXPORT_DEBUG_FIELDS = new Set<GtiStructuredFieldKey>([
  "respondentType",
  "cityAreaName",
  "brandSmokedMostOften",
]);

type FinalizeNormalizedFeedbackInput = Partial<
  Record<GtiStructuredFieldKey, string | string[] | null | undefined>
> & {
  confidenceNotes?: readonly string[];
  missingOrUnclearFields?: readonly string[];
};

export function isSingleSelectField(
  fieldKey: GtiExtractedFieldKey,
): fieldKey is GtiSingleSelectFieldKey {
  return SINGLE_SELECT_FIELD_KEY_SET.has(fieldKey);
}

export function isFinalFreeTextField(
  fieldKey: GtiStructuredFieldKey,
): fieldKey is (typeof GTI_FREE_TEXT_FIELD_KEYS)[number] {
  return FREE_TEXT_FIELD_KEY_SET.has(fieldKey);
}

export function normalizeSingleSelectFieldValue<K extends GtiSingleSelectFieldKey>(
  fieldKey: K,
  value: unknown,
): {
  value: SingleSelectNormalizedValue<K>;
  ambiguous: boolean;
  candidates: string[];
} {
  const resolvedValues = collectResolvedSingleValues(fieldKey, value);
  const counts = countValues(resolvedValues);

  if (counts.length === 0) {
    return { value: "" as SingleSelectNormalizedValue<K>, ambiguous: false, candidates: [] as string[] };
  }

  if (counts.length === 1) {
    return {
      value: counts[0].value as SingleSelectNormalizedValue<K>,
      ambiguous: false,
      candidates: counts.map((item) => item.value),
    };
  }

  const [best, runnerUp] = counts;

  if (best.count > runnerUp.count) {
    return {
      value: best.value as SingleSelectNormalizedValue<K>,
      ambiguous: false,
      candidates: counts.map((item) => item.value),
    };
  }

  return {
    value: "" as SingleSelectNormalizedValue<K>,
    ambiguous: true,
    candidates: counts.map((item) => item.value),
  };
}

export function normalizeMultiSelectFieldValue(value: unknown) {
  const candidates = collectTextCandidates(value);
  const counted = countValues(
    candidates
      .map((candidate) => resolveMainReasonValue(candidate))
      .filter(Boolean),
  );

  return counted
    .slice(0, 2)
    .map((item) => item.value) as NormalizedFeedbackForm["mainReasonForRating"];
}

export function finalizeNormalizedFeedbackForm(
  value: FinalizeNormalizedFeedbackInput,
): NormalizedFeedbackForm {
  const normalized = createEmptyNormalizedFeedbackForm(
    normalizeScalarText(value.sourceFileName),
  );

  normalized.cityAreaName = normalizeStructuredField("cityAreaName", value.cityAreaName);
  normalized.milanoSkuTested = normalizeSingleSelectFieldValue(
    "milanoSkuTested",
    value.milanoSkuTested,
  ).value as NormalizedFeedbackForm["milanoSkuTested"];
  normalized.cigaretteFilterType = normalizeSingleSelectFieldValue(
    "cigaretteFilterType",
    value.cigaretteFilterType,
  ).value as NormalizedFeedbackForm["cigaretteFilterType"];
  normalized.respondentType = normalizeSingleSelectFieldValue(
    "respondentType",
    value.respondentType,
  ).value as NormalizedFeedbackForm["respondentType"];
  normalized.respondentAgeGroup = normalizeSingleSelectFieldValue(
    "respondentAgeGroup",
    value.respondentAgeGroup,
  ).value as NormalizedFeedbackForm["respondentAgeGroup"];
  normalized.brandSmokedMostOften = normalizeStructuredField(
    "brandSmokedMostOften",
    value.brandSmokedMostOften,
  );
  normalized.smokingFrequency = normalizeSingleSelectFieldValue(
    "smokingFrequency",
    value.smokingFrequency,
  ).value as NormalizedFeedbackForm["smokingFrequency"];
  normalized.drawEffort = normalizeSingleSelectFieldValue(
    "drawEffort",
    value.drawEffort,
  ).value as NormalizedFeedbackForm["drawEffort"];
  normalized.smokeVolume = normalizeSingleSelectFieldValue(
    "smokeVolume",
    value.smokeVolume,
  ).value as NormalizedFeedbackForm["smokeVolume"];
  normalized.smokeSmoothness = normalizeSingleSelectFieldValue(
    "smokeSmoothness",
    value.smokeSmoothness,
  ).value as NormalizedFeedbackForm["smokeSmoothness"];
  normalized.tasteFlavorFeeling = normalizeSingleSelectFieldValue(
    "tasteFlavorFeeling",
    value.tasteFlavorFeeling,
  ).value as NormalizedFeedbackForm["tasteFlavorFeeling"];
  normalized.aftertasteFeeling = normalizeSingleSelectFieldValue(
    "aftertasteFeeling",
    value.aftertasteFeeling,
  ).value as NormalizedFeedbackForm["aftertasteFeeling"];
  normalized.filterComfortFeel = normalizeSingleSelectFieldValue(
    "filterComfortFeel",
    value.filterComfortFeel,
  ).value as NormalizedFeedbackForm["filterComfortFeel"];
  normalized.burningSpeed = normalizeSingleSelectFieldValue(
    "burningSpeed",
    value.burningSpeed,
  ).value as NormalizedFeedbackForm["burningSpeed"];
  normalized.ashQualityColor = normalizeSingleSelectFieldValue(
    "ashQualityColor",
    value.ashQualityColor,
  ).value as NormalizedFeedbackForm["ashQualityColor"];
  normalized.tasteFlavorConsistency = normalizeSingleSelectFieldValue(
    "tasteFlavorConsistency",
    value.tasteFlavorConsistency,
  ).value as NormalizedFeedbackForm["tasteFlavorConsistency"];
  normalized.outerPackVisualAppeal = normalizeSingleSelectFieldValue(
    "outerPackVisualAppeal",
    value.outerPackVisualAppeal,
  ).value as NormalizedFeedbackForm["outerPackVisualAppeal"];
  normalized.packColourAttractiveness = normalizeSingleSelectFieldValue(
    "packColourAttractiveness",
    value.packColourAttractiveness,
  ).value as NormalizedFeedbackForm["packColourAttractiveness"];
  normalized.packQualityFeelOpeningStrength = normalizeSingleSelectFieldValue(
    "packQualityFeelOpeningStrength",
    value.packQualityFeelOpeningStrength,
  ).value as NormalizedFeedbackForm["packQualityFeelOpeningStrength"];
  normalized.priceValueMilanoOdysseyBlack = normalizeSingleSelectFieldValue(
    "priceValueMilanoOdysseyBlack",
    value.priceValueMilanoOdysseyBlack,
  ).value as NormalizedFeedbackForm["priceValueMilanoOdysseyBlack"];
  normalized.priceValueMilanoOdysseyGold = normalizeSingleSelectFieldValue(
    "priceValueMilanoOdysseyGold",
    value.priceValueMilanoOdysseyGold,
  ).value as NormalizedFeedbackForm["priceValueMilanoOdysseyGold"];
  normalized.priceValueMilanoCherryVintage = normalizeSingleSelectFieldValue(
    "priceValueMilanoCherryVintage",
    value.priceValueMilanoCherryVintage,
  ).value as NormalizedFeedbackForm["priceValueMilanoCherryVintage"];
  normalized.overallSatisfactionRating = normalizeSingleSelectFieldValue(
    "overallSatisfactionRating",
    value.overallSatisfactionRating,
  ).value as NormalizedFeedbackForm["overallSatisfactionRating"];
  normalized.mainReasonForRating = normalizeMultiSelectFieldValue(
    value.mainReasonForRating,
  );
  normalized.wouldBuy = normalizeSingleSelectFieldValue(
    "wouldBuy",
    value.wouldBuy,
  ).value as NormalizedFeedbackForm["wouldBuy"];
  normalized.wouldRecommend = normalizeSingleSelectFieldValue(
    "wouldRecommend",
    value.wouldRecommend,
  ).value as NormalizedFeedbackForm["wouldRecommend"];
  normalized.likedMost = normalizeStructuredField("likedMost", value.likedMost);
  normalized.shouldImprove = normalizeStructuredField("shouldImprove", value.shouldImprove);
  normalized.confidenceNotes = uniqueStrings(value.confidenceNotes ?? []);
  normalized.missingOrUnclearFields = sanitizeMissingFieldKeys(
    [...(value.missingOrUnclearFields ?? [])],
  );

  return normalizedFeedbackFormSchema.parse(normalized);
}

export function normalizeStructuredField(
  fieldKey: GtiStructuredFieldKey,
  value: unknown,
) {
  const normalizedValue = normalizeScalarText(value);

  if (!normalizedValue) {
    return "";
  }

  if (isFinalFreeTextField(fieldKey)) {
    return normalizeGtiFreeTextField(fieldKey, normalizedValue);
  }

  return normalizedValue;
}

export function logExportFieldNormalization({
  context,
  fieldKey,
  before,
  after,
  written,
}: {
  context: string;
  fieldKey: GtiStructuredFieldKey;
  before: unknown;
  after: unknown;
  written: unknown;
}) {
  if (process.env.GTI_EXPORT_DEBUG !== "1" || !EXPORT_DEBUG_FIELDS.has(fieldKey)) {
    return;
  }

  console.info(
    `[gti-export-debug] ${context} ${fieldKey}: before=${JSON.stringify(before)} after=${JSON.stringify(after)} written=${JSON.stringify(written)}`,
  );
}

function collectResolvedSingleValues(
  fieldKey: GtiSingleSelectFieldKey,
  value: unknown,
) {
  const rawCandidates = collectTextCandidates(value);

  if (
    fieldKey === "drawEffort" ||
    fieldKey === "smokeVolume" ||
    fieldKey === "smokeSmoothness" ||
    fieldKey === "tasteFlavorFeeling" ||
    fieldKey === "aftertasteFeeling" ||
    fieldKey === "filterComfortFeel" ||
    fieldKey === "burningSpeed" ||
    fieldKey === "outerPackVisualAppeal" ||
    fieldKey === "packColourAttractiveness" ||
    fieldKey === "packQualityFeelOpeningStrength" ||
    fieldKey === "overallSatisfactionRating" ||
    fieldKey === "tasteFlavorConsistency"
  ) {
    return rawCandidates.flatMap((candidate) =>
      [...new Set(candidate.match(/[1-5]/g) ?? [])]
        .map((digit) => resolveSingleSelectCandidate(fieldKey, digit))
        .filter(Boolean),
    );
  }

  return rawCandidates
    .map((candidate) => resolveSingleSelectCandidate(fieldKey, candidate))
    .filter(Boolean);
}

function resolveSingleSelectCandidate(
  fieldKey: GtiSingleSelectFieldKey,
  value: string,
) {
  const cleanedValue = normalizeScalarText(value);

  if (!cleanedValue) {
    return "";
  }

  const allowedValues = SINGLE_SELECT_OPTIONS_BY_FIELD[fieldKey];
  const normalizedValue = normalizeOptionToken(cleanedValue);
  const directMatch = allowedValues.find(
    (option) => normalizeOptionToken(option) === normalizedValue,
  );

  if (directMatch) {
    return directMatch;
  }

  return SINGLE_SELECT_ALIASES[fieldKey]?.[normalizedValue] ?? "";
}

function resolveMainReasonValue(value: string) {
  const cleanedValue = normalizeScalarText(value);

  if (!cleanedValue) {
    return "";
  }

  const normalizedValue = normalizeOptionToken(cleanedValue);
  return (
    gtiMainReasonForRatingOptions.find(
      (option) => normalizeOptionToken(option) === normalizedValue,
    ) ?? ""
  );
}

function collectTextCandidates(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectTextCandidates(item));
  }

  if (typeof value !== "string") {
    return [];
  }

  const cleaned = normalizeScalarText(value);

  if (!cleaned) {
    return [];
  }

  const splitCandidates = cleaned
    .split(/\s*(?:\||,|;|\n)\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return [cleaned, ...splitCandidates];
}

function normalizeScalarText(value: unknown) {
  if (Array.isArray(value)) {
    return normalizeScalarText(value.find((item) => typeof item === "string") ?? "");
  }

  if (typeof value !== "string") {
    return "";
  }

  return normalizeFreeTextWhitespace(value);
}

function normalizeOptionToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+]+/g, "");
}

function countValues(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.map((value) => normalizeScalarText(value)).filter(Boolean))];
}
