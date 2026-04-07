import { NextResponse } from "next/server";
import { serializeFeedbackRecord } from "@/lib/feedback-records";
import { getPrismaClient } from "@/lib/prisma";
import {
  deleteRecordApiSuccessSchema,
  recordsApiSuccessSchema,
  type BasicApiError,
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

    return NextResponse.json(
      recordsApiSuccessSchema.parse({
        success: true,
        records: records.map(serializeFeedbackRecord),
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
