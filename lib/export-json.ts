import type { ExtractionBatchResult } from "@/lib/types";

export function downloadExtractionJson(result: ExtractionBatchResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "gti-feedback-extraction.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
