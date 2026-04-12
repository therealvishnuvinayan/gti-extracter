import { NextResponse } from "next/server";
import { extractFeedbackForms } from "@/lib/feedback-form-pipeline";
import { getOpenAIClient } from "@/lib/openai";
import {
  extractApiErrorCodeSchema,
  resolveSupportedFileType,
  type ExtractApiErrorCode,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_UPLOAD_FILES = 12;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadedFiles = collectUploadedFiles(formData);
    const debug = resolveDebugMode(formData);

    if (uploadedFiles.length === 0) {
      throw new ExtractRouteError(
        400,
        "BAD_REQUEST",
        "Choose at least one scanned PDF or image before starting extraction.",
      );
    }

    if (uploadedFiles.length > MAX_UPLOAD_FILES) {
      throw new ExtractRouteError(
        400,
        "TOO_MANY_FILES",
        `Upload up to ${MAX_UPLOAD_FILES} GTI feedback forms per batch.`,
      );
    }

    const supportedFiles = await Promise.all(
      uploadedFiles.map(async (uploadedFile) => {
        if (uploadedFile.size === 0) {
          throw new ExtractRouteError(
            400,
            "EMPTY_FILE",
            `The file "${uploadedFile.name}" is empty. Please upload a valid PDF or image.`,
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
            `The file "${uploadedFile.name}" is not supported. Use JPG, PNG, WEBP, or PDF.`,
          );
        }

        return {
          fileName: uploadedFile.name,
          mimeType: resolvedMimeType,
          bytes: Buffer.from(await uploadedFile.arrayBuffer()),
        };
      }),
    );

    try {
      getOpenAIClient();
    } catch {
      throw new ExtractRouteError(
        500,
        "OPENAI_NOT_CONFIGURED",
        "OPENAI_API_KEY is missing on the server. Add it before running extraction.",
      );
    }

    const extraction = await extractFeedbackForms(supportedFiles, { debug });

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
            "Something went wrong while extracting the uploaded GTI forms. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}

function collectUploadedFiles(formData: FormData) {
  const multiFiles = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File);

  if (multiFiles.length > 0) {
    return multiFiles;
  }

  const singleFile = formData.get("file");

  if (singleFile instanceof File) {
    return [singleFile];
  }

  return [];
}

function resolveDebugMode(formData: FormData) {
  const rawDebugValue = formData.get("debug");

  if (typeof rawDebugValue === "string") {
    return /^(1|true|yes|on)$/i.test(rawDebugValue.trim());
  }

  return /^(1|true|yes|on)$/i.test(process.env.GTI_EXTRACTION_DEBUG ?? "");
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
