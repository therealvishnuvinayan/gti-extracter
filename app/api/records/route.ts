import { NextResponse } from "next/server";
import { serializeFeedbackRecord } from "@/lib/feedback-records";
import { getPrismaClient } from "@/lib/prisma";
import { recordsApiSuccessSchema, type BasicApiError } from "@/lib/types";

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

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Add your Neon connection string before loading records.",
    );
  }
}
