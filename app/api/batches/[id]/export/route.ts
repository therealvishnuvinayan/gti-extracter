import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  FEEDBACK_EXPORT_HEADERS,
  serializeFeedbackRecord,
  toFeedbackExportRow,
} from "@/lib/feedback-records";
import { getPrismaClient } from "@/lib/prisma";
import { BatchServiceError } from "@/lib/batches/shared";
import { type BasicApiError } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const prisma = getPrismaClient();
    const items = await prisma.extractionBatchItem.findMany({
      where: {
        batchId: id,
        feedbackId: {
          not: null,
        },
      },
      include: {
        feedback: true,
      },
      orderBy: {
        queueOrder: "asc",
      },
    });

    const rows = items
      .map((item) => item.feedback)
      .filter((feedback): feedback is NonNullable<typeof feedback> => Boolean(feedback))
      .map(serializeFeedbackRecord)
      .map(toFeedbackExportRow);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: [...FEEDBACK_EXPORT_HEADERS],
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Records");

    const workbookBytes = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    return new NextResponse(workbookBytes, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="gti-batch-${id}.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof BatchServiceError || error instanceof Error
              ? error.message
              : "The batch export could not be generated.",
        },
      } satisfies BasicApiError,
      { status: error instanceof BatchServiceError ? error.status : 500 },
    );
  }
}
