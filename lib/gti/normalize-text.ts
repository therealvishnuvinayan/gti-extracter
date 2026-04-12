import type { GtiExtractedFieldKey } from "@/lib/gti/template";

export const GTI_FREE_TEXT_FIELD_KEYS = [
  "cityAreaName",
  "brandSmokedMostOften",
  "likedMost",
  "shouldImprove",
] as const satisfies readonly GtiExtractedFieldKey[];

type GtiFreeTextFieldKey = (typeof GTI_FREE_TEXT_FIELD_KEYS)[number];

const FREE_TEXT_FIELD_KEY_SET = new Set<GtiExtractedFieldKey>(GTI_FREE_TEXT_FIELD_KEYS);

const FREE_TEXT_CORRECTIONS: Record<GtiFreeTextFieldKey, readonly [string, string][]> = {
  cityAreaName: [
    ["Kabul - Police Surkh", "Kabul - Poli-e Surkh"],
    ["Police Surkh", "Poli-e Surkh"],
  ],
  brandSmokedMostOften: [["Seven Star", "Seven Stars"]],
  likedMost: [],
  shouldImprove: [],
};

export function isGtiFreeTextField(
  fieldKey: GtiExtractedFieldKey,
): fieldKey is GtiFreeTextFieldKey {
  return FREE_TEXT_FIELD_KEY_SET.has(fieldKey);
}

export function normalizeGtiFreeTextField(
  fieldKey: GtiFreeTextFieldKey,
  value: string,
) {
  let normalized = normalizeFreeTextWhitespace(value);

  for (const [from, to] of FREE_TEXT_CORRECTIONS[fieldKey]) {
    normalized = replaceExactPhrase(normalized, from, to);
  }

  return normalized.trim();
}

export function normalizeFreeTextWhitespace(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function replaceExactPhrase(value: string, source: string, target: string) {
  const pattern = new RegExp(`\\b${escapeRegExp(source)}\\b`, "gi");
  return value.replace(pattern, target);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
