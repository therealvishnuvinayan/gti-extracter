import { NextResponse } from "next/server";
import { EXTRACTION_PROMPT, EXTRACTION_RESPONSE_JSON_SCHEMA } from "@/lib/extract-prompt";
import { getExtractionModel, getOpenAIClient } from "@/lib/openai";
import {
  extractApiErrorCodeSchema,
  extractionResultSchema,
  hasAnyStructuredFieldValue,
  resolveSupportedFileType,
  type ExtractApiErrorCode,
  type ExtractionFields,
  type GenericKeyDetail,
  type ExtractionResult,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      throw new ExtractRouteError(
        400,
        "BAD_REQUEST",
        "Choose a document before starting extraction.",
      );
    }

    if (uploadedFile.size === 0) {
      throw new ExtractRouteError(
        400,
        "EMPTY_FILE",
        "The selected file is empty. Please upload a valid image or PDF.",
      );
    }

    const resolvedMimeType = resolveSupportedFileType(
      uploadedFile.name,
      uploadedFile.type,
    );

    if (!resolvedMimeType) {
      throw new ExtractRouteError(
        415,
        "UNSUPPORTED_FILE_TYPE",
        "Only JPG, PNG, WEBP, and PDF files are supported right now.",
      );
    }

    const bytes = Buffer.from(await uploadedFile.arrayBuffer());
    const extraction = await extractDocument({
      bytes,
      fileName: uploadedFile.name,
      mimeType: resolvedMimeType,
    });

    if (isExtractionTooUnclear(extraction)) {
      throw new ExtractRouteError(
        422,
        "UNCLEAR_DOCUMENT",
        "The document is too unclear to extract reliably. Try a sharper image or cleaner scan.",
      );
    }

    return NextResponse.json({
      success: true,
      data: extraction,
    });
  } catch (error) {
    if (error instanceof ExtractRouteError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            "Something went wrong while processing the document. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}

async function extractDocument({
  bytes,
  fileName,
  mimeType,
}: {
  bytes: Buffer;
  fileName: string;
  mimeType: string;
}) {
  let client;

  try {
    client = getOpenAIClient();
  } catch {
    throw new ExtractRouteError(
      500,
      "OPENAI_NOT_CONFIGURED",
      "OPENAI_API_KEY is missing on the server. Add it before running extraction.",
    );
  }

  const model = getExtractionModel();
  const base64 = bytes.toString("base64");

  try {
    const response = await client.responses.create({
      model,
      store: false,
      instructions: EXTRACTION_PROMPT,
      max_output_tokens: 2200,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Extract the uploaded document into the requested schema.",
                `File name: ${fileName}`,
                `MIME type: ${mimeType}`,
              ].join("\n"),
            },
            mimeType === "application/pdf"
              ? {
                  type: "input_file",
                  filename: fileName,
                  file_data: base64,
                }
              : {
                  type: "input_image",
                  detail: "high",
                  image_url: `data:${mimeType};base64,${base64}`,
                },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "document_extraction_result",
          strict: true,
          schema: EXTRACTION_RESPONSE_JSON_SCHEMA,
        },
      },
    });

    const rawOutput = response.output_text?.trim();

    if (!rawOutput) {
      throw new ExtractRouteError(
        502,
        "INVALID_AI_RESPONSE",
        "The extraction service returned an empty response.",
      );
    }

    let parsedOutput: unknown;

    try {
      parsedOutput = JSON.parse(rawOutput);
    } catch {
      throw new ExtractRouteError(
        502,
        "INVALID_AI_RESPONSE",
        "The extraction response was malformed and could not be validated.",
      );
    }

    const validated = extractionResultSchema.safeParse(parsedOutput);

    if (!validated.success) {
      throw new ExtractRouteError(
        502,
        "INVALID_AI_RESPONSE",
        "The extraction response did not match the expected result shape.",
      );
    }

    return normalizeExtractionResult(validated.data);
  } catch (error) {
    if (error instanceof ExtractRouteError) {
      throw error;
    }

    throw new ExtractRouteError(
      502,
      "OPENAI_ERROR",
      "OpenAI could not process this document right now. Please try again.",
    );
  }
}

function normalizeExtractionResult(result: ExtractionResult): ExtractionResult {
  return {
    documentTitle: cleanString(result.documentTitle),
    documentType: cleanString(result.documentType),
    detectedLanguage: cleanString(result.detectedLanguage),
    documentSummary: cleanString(result.documentSummary),
    rawTranscription: cleanString(result.rawTranscription),
    englishTranslation: cleanString(result.englishTranslation),
    keyDetails: normalizeKeyDetails(result.keyDetails),
    fields: normalizeFields(result.fields),
    confidenceNotes: normalizeStringArray(result.confidenceNotes),
    missingOrUnclearFields: normalizeStringArray(result.missingOrUnclearFields),
  };
}

function normalizeFields(fields: ExtractionFields): ExtractionFields {
  return {
    name: cleanString(fields.name),
    place: cleanString(fields.place),
    shopName: cleanString(fields.shopName),
    number: cleanString(fields.number),
    whatsapp: cleanString(fields.whatsapp),
    address: cleanString(fields.address),
    product: cleanString(fields.product),
    suggestions: cleanString(fields.suggestions),
  };
}

function normalizeStringArray(values: string[]) {
  return values.map(cleanString).filter(Boolean);
}

function normalizeKeyDetails(values: GenericKeyDetail[]) {
  return values
    .map((item) => ({
      label: cleanString(item.label),
      value: cleanString(item.value),
    }))
    .filter((item) => item.label && item.value);
}

function cleanString(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function isExtractionTooUnclear(result: ExtractionResult) {
  const hasAnyFieldValue = hasAnyStructuredFieldValue(result.fields);
  const hasKeyDetails = result.keyDetails.length > 0;
  const hasTranscription = result.rawTranscription.trim().length > 8;

  return !hasAnyFieldValue && !hasKeyDetails && !hasTranscription;
}

class ExtractRouteError extends Error {
  status: number;
  code: ExtractApiErrorCode;

  constructor(status: number, code: ExtractApiErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = extractApiErrorCodeSchema.parse(code);
  }
}
