import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  FEEDBACK_EXPORT_HEADERS,
  serializeFeedbackRecord,
  toFeedbackExportRow,
} from "@/lib/feedback-records";
import { getPrismaClient } from "@/lib/prisma";
import { buildExportWorkbook } from "@/lib/template-export";
import {
  extractApiErrorCodeSchema,
  extractionBatchResultSchema,
  resolveTemplateWorkbookType,
  type BasicApiError,
  type ExtractApiErrorCode,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  try {
    assertDatabaseConfigured();

    const prisma = getPrismaClient();
    const records = await prisma.feedback.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    const serializedRecords = records.map(serializeFeedbackRecord);
    const workbook = XLSX.utils.book_new();
    const rows = serializedRecords.map(toFeedbackExportRow);
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: [...FEEDBACK_EXPORT_HEADERS],
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback Records");

    const workbookBytes = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    return new NextResponse(workbookBytes, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="gti-feedback-records.xlsx"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "The database export could not be generated.",
        },
      } satisfies BasicApiError,
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawResults = formData.get("results");
    const templateFile = formData.get("template");

    if (typeof rawResults !== "string") {
      throw new ExportRouteError(
        400,
        "BAD_REQUEST",
        "The extracted results payload is missing.",
      );
    }

    let parsedResults: unknown;

    try {
      parsedResults = JSON.parse(rawResults);
    } catch {
      throw new ExportRouteError(
        400,
        "BAD_REQUEST",
        "The extracted results payload is not valid JSON.",
      );
    }

    const validatedResults = extractionBatchResultSchema.safeParse(parsedResults);

    if (!validatedResults.success) {
      throw new ExportRouteError(
        400,
        "BAD_REQUEST",
        "The extracted results payload does not match the expected batch format.",
      );
    }

    let templateBytes: Buffer | undefined;

    if (templateFile instanceof File) {
      const templateMimeType = resolveTemplateWorkbookType(
        templateFile.name,
        templateFile.type,
      );

      if (!templateMimeType) {
        throw new ExportRouteError(
          415,
          "TEMPLATE_INVALID",
          "Upload a valid GTI template workbook in .xlsx format.",
        );
      }

      templateBytes = Buffer.from(await templateFile.arrayBuffer());
    }

    const workbookBytes = await buildExportWorkbook({
      extraction: validatedResults.data,
      templateBytes,
    });

    return new NextResponse(workbookBytes, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="gti-feedback-extraction.xlsx"',
      },
    });
  } catch (error) {
    if (error instanceof ExportRouteError) {
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
          message: "The Excel file could not be generated. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}

class ExportRouteError extends Error {
  status: number;
  code: ExtractApiErrorCode;

  constructor(status: number, code: ExtractApiErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = extractApiErrorCodeSchema.parse(code);
  }
}

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Add your Neon connection string before exporting records.",
    );
  }
}
