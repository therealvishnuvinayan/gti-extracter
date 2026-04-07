import {
  normalizedFeedbackScalarFieldKeys,
  normalizedFeedbackFieldLabels,
  type ProcessedFeedbackDocument,
} from "@/lib/types";

export function formatExtractionSummary(document: ProcessedFeedbackDocument) {
  const structuredFields = normalizedFeedbackScalarFieldKeys
    .map((key) => {
      const value = document.normalized[key];
      return `- ${normalizedFeedbackFieldLabels[key]}: ${value || "Blank"}`;
    })
    .join("\n");

  const pageSummaries =
    document.pageExtractions.length > 0
      ? document.pageExtractions
          .map(
            (page) =>
              `- Page ${page.pageNumber}: ${page.pageSummary || "No summary returned"}`,
          )
          .join("\n")
      : "- None";

  const confidenceNotes =
    document.normalized.confidenceNotes.length > 0
      ? document.normalized.confidenceNotes.map((note) => `- ${note}`).join("\n")
      : "- None";

  const missingFields =
    document.normalized.missingOrUnclearFields.length > 0
      ? document.normalized.missingOrUnclearFields
          .map((field) => `- ${field}`)
          .join("\n")
      : "- None";

  return [
    `Source File: ${document.sourceFileName}`,
    `Status: ${document.status}`,
    `Page Count: ${document.pageCount}`,
    document.errorMessage ? `Error Message: ${document.errorMessage}` : "",
    "",
    "Normalized Fields",
    structuredFields,
    "",
    "Page Summaries",
    pageSummaries,
    "",
    "Combined Transcription",
    document.combinedTranscription || "Not available",
    "",
    "Confidence Notes",
    confidenceNotes,
    "",
    "Missing Or Unclear Fields",
    missingFields,
  ]
    .filter(Boolean)
    .join("\n");
}
