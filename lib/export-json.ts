import type { ExtractionResult } from "@/lib/types";

export function downloadExtractionJson(result: ExtractionResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "extraction-result.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
