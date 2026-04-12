import "server-only";

import ExcelJS from "exceljs";
import { GTI_EXPORT_COLUMNS } from "@/lib/gti/export-columns";
import {
  finalizeNormalizedFeedbackForm,
  logExportFieldNormalization,
} from "@/lib/gti/finalize";
import {
  extractionBatchResultSchema,
  getNormalizedFeedbackFieldValue,
  normalizedFeedbackFieldLabels,
  type ExtractionBatchResult,
  type NormalizedFeedbackForm,
  type NormalizedFeedbackFieldKey,
  type ProcessedFeedbackDocument,
} from "@/lib/types";

const TEMPLATE_HEADER_ALIASES: Record<NormalizedFeedbackFieldKey, string[]> = {
  sourceFileName: [
    "source file name",
    "source filename",
    "file name",
    "filename",
    "source document",
    "pdf file name",
  ],
  cityAreaName: [
    "city / area name",
    "city area name",
    "city or area name",
    "city / area",
    "city area",
  ],
  milanoSkuTested: [
    "milano sku tested",
    "which milano sku did you test",
    "which milano sku did you test?",
    "sku tested",
    "milano sku",
  ],
  cigaretteFilterType: [
    "cigarette filter type",
    "filter type",
  ],
  respondentType: [
    "respondent type",
    "you are a",
  ],
  respondentAgeGroup: [
    "respondent age group",
    "age group",
  ],
  smokingFrequency: [
    "smoking frequency",
    "how often do you smoke cigarettes",
    "how often do you smoke cigarettes?",
  ],
  drawEffort: ["draw effort"],
  smokeVolume: ["smoke volume"],
  smokeSmoothness: ["smoke smoothness"],
  tasteFlavorFeeling: [
    "taste / flavor feeling",
    "taste flavor feeling",
    "taste/flavor feeling",
  ],
  aftertasteFeeling: ["aftertaste feeling"],
  filterComfortFeel: ["filter comfort feel"],
  burningSpeed: ["burning speed"],
  ashQualityColor: [
    "ash quality / color",
    "ash quality color",
    "ash colour",
  ],
  tasteFlavorConsistency: [
    "taste / flavor consistency",
    "taste flavor consistency",
    "taste/flavor consistency",
  ],
  outerPackVisualAppeal: [
    "outer pack visual appeal",
    "outer pack appeal",
  ],
  packColourAttractiveness: [
    "pack colour attractiveness",
    "pack color attractiveness",
    "pack colour appeal",
  ],
  packQualityFeelOpeningStrength: [
    "pack quality / feel / opening strength",
    "pack quality feel opening strength",
    "pack quality",
  ],
  priceValueMilanoOdysseyBlack: [
    "price / value - milano odyssey black",
    "price value milano odyssey black",
    "milano odyssey black",
    "value for money milano odyssey black",
  ],
  priceValueMilanoOdysseyGold: [
    "price / value - milano odyssey gold",
    "price value milano odyssey gold",
    "milano odyssey gold",
    "value for money milano odyssey gold",
  ],
  priceValueMilanoCherryVintage: [
    "price / value - milano cherry vintage",
    "price value milano cherry vintage",
    "milano cherry vintage",
    "value for money milano cherry vintage",
  ],
  overallSatisfactionRating: [
    "overall satisfaction rating",
    "overall satisfaction",
  ],
  mainReasonForRating: [
    "main reason for rating",
    "reason for rating",
  ],
  wouldBuy: [
    "would buy",
    "would you buy this product",
    "would you buy this product?",
  ],
  wouldRecommend: [
    "would recommend",
    "would you recommend it to others",
    "would you recommend it to others?",
  ],
  likedMost: [
    "liked most",
    "what did you like most",
    "comments what did you like most",
  ],
  shouldImprove: [
    "should improve",
    "what should be improved",
    "comments what should be improved",
  ],
  brandSmokedMostOften: [
    "brand smoked most often",
    "which brand do you smoke most often",
    "which brand do you smoke most often?",
  ],
  confidenceNotes: [
    "confidence notes",
    "review notes",
    "uncertainty notes",
  ],
  missingOrUnclearFields: [
    "missing or unclear fields",
    "missing fields",
    "unclear fields",
    "review required",
  ],
};

export async function buildExportWorkbook({
  extraction,
  templateBytes,
}: {
  extraction: ExtractionBatchResult;
  templateBytes?: Buffer;
}) {
  const validated = extractionBatchResultSchema.parse(extraction);
  const workbook = new ExcelJS.Workbook();

  if (templateBytes) {
    await workbook.xlsx.load(
      templateBytes as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
  } else {
    initializeFallbackWorkbook(workbook);
  }

  const target = detectTargetWorksheet(workbook);
  writeDocumentsIntoWorksheet(target.worksheet, target.headerRowNumber, validated.documents);
  addExtractionNotesWorksheet(workbook, validated.documents);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function initializeFallbackWorkbook(workbook: ExcelJS.Workbook) {
  const worksheet = workbook.addWorksheet("GTI Feedback Data");
  worksheet.columns = GTI_EXPORT_COLUMNS.map(({ fieldKey, header }) => ({
    header,
    key: fieldKey,
    width: fieldKey === "sourceFileName" ? 28 : 24,
  }));
}

function detectTargetWorksheet(workbook: ExcelJS.Workbook) {
  if (workbook.worksheets.length === 0) {
    initializeFallbackWorkbook(workbook);
  }

  let bestMatch:
    | {
        worksheet: ExcelJS.Worksheet;
        headerRowNumber: number;
        score: number;
        headerCount: number;
      }
    | undefined;

  for (const worksheet of workbook.worksheets) {
    const lastCandidateRow = Math.max(worksheet.rowCount, 1);

    for (
      let rowNumber = 1;
      rowNumber <= Math.min(lastCandidateRow, 12);
      rowNumber += 1
    ) {
      const headers = getRowHeaders(worksheet, rowNumber);
      const populatedHeaderCount = headers.filter(Boolean).length;

      if (populatedHeaderCount === 0) {
        continue;
      }

      const recognizedCount = headers.filter((header) =>
        Boolean(resolveTemplateHeader(header)),
      ).length;
      const score = recognizedCount * 100 + populatedHeaderCount;

      if (
        !bestMatch ||
        score > bestMatch.score ||
        (score === bestMatch.score && populatedHeaderCount > bestMatch.headerCount)
      ) {
        bestMatch = {
          worksheet,
          headerRowNumber: rowNumber,
          score,
          headerCount: populatedHeaderCount,
        };
      }
    }
  }

  if (bestMatch) {
    return bestMatch;
  }

  const worksheet = workbook.worksheets[0] ?? workbook.addWorksheet("GTI Feedback Data");
  const headerRow = worksheet.getRow(1);

  if (headerRow.cellCount === 0) {
    GTI_EXPORT_COLUMNS.forEach(({ header }, index) => {
      headerRow.getCell(index + 1).value = header;
    });
  }

  return {
    worksheet,
    headerRowNumber: 1,
    score: 0,
    headerCount: GTI_EXPORT_COLUMNS.length,
  };
}

function writeDocumentsIntoWorksheet(
  worksheet: ExcelJS.Worksheet,
  headerRowNumber: number,
  documents: ProcessedFeedbackDocument[],
) {
  const headers = getRowHeaders(worksheet, headerRowNumber);

  if (headers.length === 0) {
    GTI_EXPORT_COLUMNS.forEach(({ header }, index) => {
      worksheet.getRow(headerRowNumber).getCell(index + 1).value = header;
    });
  }

  const resolvedHeaders = getRowHeaders(worksheet, headerRowNumber);
  const styleRow = worksheet.getRow(headerRowNumber + 1);
  const appendStartRow = Math.max(
    findLastNonEmptyRow(worksheet) + 1,
    headerRowNumber + 1,
  );

  documents.forEach((document, documentIndex) => {
    const rowNumber = appendStartRow + documentIndex;
    const row = worksheet.getRow(rowNumber);
    const normalized = finalizeNormalizedFeedbackForm(document.normalized);

    resolvedHeaders.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      const fieldKey = resolveTemplateHeader(header);
      const cellValue = resolveCellValue(normalized, fieldKey);
      cell.value = cellValue;

      if (fieldKey && fieldKey !== "confidenceNotes" && fieldKey !== "missingOrUnclearFields") {
        logExportFieldNormalization({
          context: `live-export:${document.sourceFileName || rowNumber}`,
          fieldKey,
          before: document.normalized[fieldKey],
          after: normalized[fieldKey],
          written: cellValue,
        });
      }

      if (styleRow.hasValues) {
        cell.style = cloneStyle(styleRow.getCell(index + 1).style);
        cell.numFmt = styleRow.getCell(index + 1).numFmt;
        cell.alignment = cloneStyle(styleRow.getCell(index + 1).alignment);
        cell.font = cloneStyle(styleRow.getCell(index + 1).font);
        cell.border = cloneStyle(styleRow.getCell(index + 1).border);
        cell.fill = cloneStyle(styleRow.getCell(index + 1).fill);
      }
    });
  });
}

function resolveCellValue(
  normalized: NormalizedFeedbackForm,
  fieldKey: NormalizedFeedbackFieldKey | null,
) {
  if (!fieldKey) {
    return "";
  }

  if (fieldKey === "confidenceNotes") {
    return joinMultivalueCell(normalized.confidenceNotes);
  }

  if (fieldKey === "missingOrUnclearFields") {
    return joinMultivalueCell(normalized.missingOrUnclearFields);
  }

  return getNormalizedFeedbackFieldValue(normalized, fieldKey, " | ");
}

function addExtractionNotesWorksheet(
  workbook: ExcelJS.Workbook,
  documents: ProcessedFeedbackDocument[],
) {
  const worksheet = workbook.addWorksheet(createUniqueSheetName(workbook, "Extraction Notes"));

  worksheet.columns = [
    { header: "Source File Name", key: "sourceFileName", width: 28 },
    { header: "Status", key: "status", width: 14 },
    { header: "Page Count", key: "pageCount", width: 12 },
    { header: "Error Message", key: "errorMessage", width: 36 },
    { header: "Confidence Notes", key: "confidenceNotes", width: 72 },
    { header: "Missing Or Unclear Fields", key: "missingOrUnclearFields", width: 56 },
    { header: "Combined Transcription", key: "combinedTranscription", width: 88 },
  ];

  documents.forEach((document) => {
    worksheet.addRow({
      sourceFileName: document.sourceFileName,
      status: document.status,
      pageCount: document.pageCount,
      errorMessage: document.errorMessage,
      confidenceNotes: joinMultivalueCell(document.normalized.confidenceNotes),
      missingOrUnclearFields: joinMultivalueCell(
        document.normalized.missingOrUnclearFields,
      ),
      combinedTranscription: document.combinedTranscription,
    });
  });

  worksheet.getColumn("confidenceNotes").alignment = {
    vertical: "top",
    wrapText: true,
  };
  worksheet.getColumn("missingOrUnclearFields").alignment = {
    vertical: "top",
    wrapText: true,
  };
  worksheet.getColumn("combinedTranscription").alignment = {
    vertical: "top",
    wrapText: true,
  };
}

function getRowHeaders(worksheet: ExcelJS.Worksheet, rowNumber: number) {
  const row = worksheet.getRow(rowNumber);
  const headers: string[] = [];

  for (let cellNumber = 1; cellNumber <= row.cellCount; cellNumber += 1) {
    const rawValue = row.getCell(cellNumber).value;
    headers.push(cellValueToString(rawValue));
  }

  return headers;
}

function findLastNonEmptyRow(worksheet: ExcelJS.Worksheet) {
  for (let rowNumber = worksheet.rowCount; rowNumber >= 1; rowNumber -= 1) {
    if (worksheet.getRow(rowNumber).hasValues) {
      return rowNumber;
    }
  }

  return 0;
}

function resolveTemplateHeader(header: string) {
  const normalizedHeader = normalizeHeader(header);

  if (!normalizedHeader) {
    return null;
  }

  for (const [fieldKey, aliases] of Object.entries(TEMPLATE_HEADER_ALIASES) as Array<
    [NormalizedFeedbackFieldKey, string[]]
  >) {
    const allAliases = [
      normalizedFeedbackFieldLabels[fieldKey],
      fieldKey,
      ...aliases,
    ].map(normalizeHeader);

    if (allAliases.includes(normalizedHeader)) {
      return fieldKey;
    }
  }

  return null;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function cellValueToString(value: ExcelJS.CellValue) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value && typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((item) => item.text).join("").trim();
    }

    if ("result" in value && value.result != null) {
      return String(value.result).trim();
    }
  }

  return "";
}

function joinMultivalueCell(values: string[]) {
  return values.filter(Boolean).join(" | ");
}

function createUniqueSheetName(workbook: ExcelJS.Workbook, baseName: string) {
  if (!workbook.getWorksheet(baseName)) {
    return baseName;
  }

  let index = 2;

  while (workbook.getWorksheet(`${baseName} ${index}`)) {
    index += 1;
  }

  return `${baseName} ${index}`;
}

function cloneStyle<T>(value: T) {
  if (value == null) {
    return value;
  }

  return structuredClone(value);
}
