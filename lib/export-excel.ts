import type { ExtractionResult } from "@/lib/types";
import {
  hasAnyStructuredFieldValue,
  structuredFieldKeys,
  structuredFieldLabels,
} from "@/lib/types";

export async function downloadExtractionExcel(result: ExtractionResult) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  const fieldsSheet = workbook.addWorksheet("Fields");
  fieldsSheet.columns = [
    { header: "Field", key: "field", width: 24 },
    { header: "Value", key: "value", width: 48 },
  ];

  structuredFieldKeys.forEach((key) => {
    fieldsSheet.addRow({
      field: structuredFieldLabels[key],
      value: result.fields[key],
    });
  });

  const detailsSheet = workbook.addWorksheet("Details");
  detailsSheet.columns = [
    { header: "Section", key: "section", width: 24 },
    { header: "Value", key: "value", width: 100 },
  ];
  detailsSheet.addRows([
    { section: "Document Title", value: result.documentTitle },
    { section: "Document Type", value: result.documentType },
    { section: "Detected Language", value: result.detectedLanguage },
    { section: "Document Summary", value: result.documentSummary },
    { section: "Raw Transcription", value: result.rawTranscription },
    { section: "English Translation", value: result.englishTranslation },
  ]);
  detailsSheet.getColumn("value").alignment = {
    vertical: "top",
    wrapText: true,
  };

  const notesSheet = workbook.addWorksheet("Notes");
  notesSheet.columns = [
    { header: "Type", key: "type", width: 24 },
    { header: "Note", key: "note", width: 96 },
  ];

  result.confidenceNotes.forEach((note) => {
    notesSheet.addRow({ type: "Confidence Note", note });
  });

  result.missingOrUnclearFields.forEach((fieldName) => {
    notesSheet.addRow({ type: "Missing / Unclear Field", note: fieldName });
  });

  if (result.keyDetails.length > 0) {
    const keyDetailsSheet = workbook.addWorksheet("Key Details");
    keyDetailsSheet.columns = [
      { header: "Label", key: "label", width: 32 },
      { header: "Value", key: "value", width: 72 },
    ];

    result.keyDetails.forEach((item) => {
      keyDetailsSheet.addRow(item);
    });
  }

  if (!hasAnyStructuredFieldValue(result.fields)) {
    fieldsSheet.addRow({
      field: "Note",
      value: "No customer-form-specific fields were detected for this document.",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "extraction-result.xlsx";
  anchor.click();
  URL.revokeObjectURL(url);
}
