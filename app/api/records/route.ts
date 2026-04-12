import { NextResponse } from "next/server";
import { DEFAULT_RECORDS_PAGE_SIZE, resolvePaginationParams } from "@/lib/batches/shared";
import { serializeFeedbackRecord } from "@/lib/feedback-records";
import { getPrismaClient } from "@/lib/prisma";
import {
  deleteRecordApiSuccessSchema,
  paginatedRecordsApiSuccessSchema,
  type BasicApiError,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();

    const { searchParams } = new URL(request.url);
    const pagination = resolvePaginationParams({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
    });
    const prisma = getPrismaClient();
    const [totalItems, records] = await prisma.$transaction([
      prisma.feedback.count(),
      prisma.feedback.findMany({
        orderBy: {
          createdAt: "desc",
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
    ]);
    const totalPages =
      totalItems === 0
        ? 0
        : Math.ceil(totalItems / Math.max(pagination.pageSize, DEFAULT_RECORDS_PAGE_SIZE));

    return NextResponse.json(
      paginatedRecordsApiSuccessSchema.parse({
        success: true,
        items: records.map(serializeFeedbackRecord),
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems,
        totalPages,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Saved feedback records could not be loaded.",
        },
      } satisfies BasicApiError,
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    assertDatabaseConfigured();

    const payload: unknown = await request.json();
    const id =
      payload &&
      typeof payload === "object" &&
      "id" in payload &&
      typeof payload.id === "string"
        ? payload.id.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "A record id is required to delete a saved row.",
          },
        } satisfies BasicApiError,
        { status: 400 },
      );
    }

    const prisma = getPrismaClient();
    await prisma.feedback.delete({
      where: { id },
    });

    return NextResponse.json(
      deleteRecordApiSuccessSchema.parse({
        success: true,
        id,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "The saved record could not be deleted.",
        },
      } satisfies BasicApiError,
      { status: 500 },
    );
  }
}

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Add your Neon connection string before loading records.",
    );
  }
}
