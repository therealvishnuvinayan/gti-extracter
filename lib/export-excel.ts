import {
  extractApiErrorSchema,
  type ExtractionBatchResult,
} from "@/lib/types";

export async function downloadExtractionExcel({
  result,
  templateFile,
}: {
  result: ExtractionBatchResult;
  templateFile?: File | null;
}) {
  const formData = new FormData();
  formData.append("results", JSON.stringify(result));

  if (templateFile) {
    formData.append("template", templateFile);
  }

  const response = await fetch("/api/export", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const parsedError = extractApiErrorSchema.safeParse(payload);

    throw new Error(
      parsedError.success
        ? parsedError.data.error.message
        : "The Excel file could not be generated.",
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "gti-feedback-extraction.xlsx";
  anchor.click();
  URL.revokeObjectURL(url);
}
