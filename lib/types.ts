import { z } from "zod";

export const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const ACCEPTED_FILE_TYPES = SUPPORTED_FILE_TYPES.join(",");

export const structuredFieldKeys = [
  "name",
  "place",
  "shopName",
  "number",
  "whatsapp",
  "address",
  "product",
  "suggestions",
] as const;

export type StructuredFieldKey = (typeof structuredFieldKeys)[number];

export const structuredFieldLabels: Record<StructuredFieldKey, string> = {
  name: "Name",
  place: "Place",
  shopName: "Shop Name",
  number: "Number",
  whatsapp: "WhatsApp",
  address: "Address",
  product: "Product",
  suggestions: "Suggestions",
};

export const genericKeyDetailSchema = z
  .object({
    label: z.string(),
    value: z.string(),
  })
  .strict();

export const extractionFieldsSchema = z
  .object({
    name: z.string(),
    place: z.string(),
    shopName: z.string(),
    number: z.string(),
    whatsapp: z.string(),
    address: z.string(),
    product: z.string(),
    suggestions: z.string(),
  })
  .strict();

export const extractionResultSchema = z
  .object({
    documentTitle: z.string(),
    documentType: z.string(),
    detectedLanguage: z.string(),
    documentSummary: z.string(),
    rawTranscription: z.string(),
    englishTranslation: z.string(),
    keyDetails: z.array(genericKeyDetailSchema),
    fields: extractionFieldsSchema,
    confidenceNotes: z.array(z.string()),
    missingOrUnclearFields: z.array(z.string()),
  })
  .strict();

export const extractApiErrorCodeSchema = z.enum([
  "BAD_REQUEST",
  "EMPTY_FILE",
  "UNSUPPORTED_FILE_TYPE",
  "PDF_NOT_SUPPORTED",
  "OPENAI_NOT_CONFIGURED",
  "OPENAI_ERROR",
  "INVALID_AI_RESPONSE",
  "UNCLEAR_DOCUMENT",
  "INTERNAL_ERROR",
]);

export const extractApiSuccessSchema = z.object({
  success: z.literal(true),
  data: extractionResultSchema,
});

export const extractApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: extractApiErrorCodeSchema,
    message: z.string(),
  }),
});

export type ExtractionFields = z.infer<typeof extractionFieldsSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;
export type ExtractApiErrorCode = z.infer<typeof extractApiErrorCodeSchema>;

export type StructuredFieldView = {
  id: StructuredFieldKey;
  label: string;
  value: string;
};

export type GenericKeyDetail = z.infer<typeof genericKeyDetailSchema>;

export function isSupportedFileType(value: string) {
  return SUPPORTED_FILE_TYPES.includes(value as (typeof SUPPORTED_FILE_TYPES)[number]);
}

export function resolveSupportedFileType(fileName: string, mimeType: string) {
  if (isSupportedFileType(mimeType)) {
    return mimeType;
  }

  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (lowerName.endsWith(".png")) {
    return "image/png";
  }

  if (lowerName.endsWith(".webp")) {
    return "image/webp";
  }

  if (lowerName.endsWith(".pdf")) {
    return "application/pdf";
  }

  return null;
}

export function toStructuredFieldViews(
  fields: ExtractionFields,
): StructuredFieldView[] {
  return structuredFieldKeys.map((key) => ({
    id: key,
    label: structuredFieldLabels[key],
    value: fields[key],
  }));
}

export function hasAnyStructuredFieldValue(fields: ExtractionFields) {
  return Object.values(fields).some((value) => value.trim().length > 0);
}
