import {
  hasAnyStructuredFieldValue,
  structuredFieldKeys,
  structuredFieldLabels,
  type ExtractionResult,
} from "@/lib/types";

export function formatExtractionSummary(result: ExtractionResult) {
  const structuredFields = structuredFieldKeys
    .map((key) => `- ${structuredFieldLabels[key]}: ${result.fields[key] || "Not found"}`)
    .join("\n");

  const keyDetails =
    result.keyDetails.length > 0
      ? result.keyDetails.map((item) => `- ${item.label}: ${item.value}`).join("\n")
      : "- None";

  const confidenceNotes =
    result.confidenceNotes.length > 0
      ? result.confidenceNotes.map((note) => `- ${note}`).join("\n")
      : "- None";

  const missingFields =
    result.missingOrUnclearFields.length > 0
      ? result.missingOrUnclearFields.map((field) => `- ${field}`).join("\n")
      : "- None";

  return [
    `Document Title: ${result.documentTitle || "Not found"}`,
    `Document Type: ${result.documentType || "Unknown"}`,
    `Detected Language: ${result.detectedLanguage || "Unknown"}`,
    "",
    "Document Summary",
    result.documentSummary || "Not available",
    "",
    "Key Details",
    keyDetails,
    "",
    "Structured Fields",
    hasAnyStructuredFieldValue(result.fields)
      ? structuredFields
      : "- No customer-form-specific fields detected",
    "",
    "Raw Transcription",
    result.rawTranscription || "Not available",
    "",
    "English Translation",
    result.englishTranslation || "Not available",
    "",
    "Confidence Notes",
    confidenceNotes,
    "",
    "Missing or Unclear Fields",
    missingFields,
  ].join("\n");
}
