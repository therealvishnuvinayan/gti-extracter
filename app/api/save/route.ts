import { NextResponse } from "next/server";
import { toFeedbackCreateData, serializeFeedbackRecord } from "@/lib/feedback-records";
import { getPrismaClient } from "@/lib/prisma";
import {
  extractionBatchResultSchema,
  saveRecordsApiSuccessSchema,
  type BasicApiError,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const payload: unknown = await request.json();
    const parsed = extractionBatchResultSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "The extracted payload does not match the expected batch format.",
          },
        } satisfies BasicApiError,
        { status: 400 },
      );
    }

    const prisma = getPrismaClient();
    const savedRecords = await prisma.$transaction(
      parsed.data.documents.map((document) =>
        prisma.feedback.create({
          data: toFeedbackCreateData(document),
        }),
      ),
    );

    return NextResponse.json(
      saveRecordsApiSuccessSchema.parse({
        success: true,
        savedCount: savedRecords.length,
        records: savedRecords.map(serializeFeedbackRecord),
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
              : "The extracted forms could not be saved to the database.",
        },
      } satisfies BasicApiError,
      { status: 500 },
    );
  }
}

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Add your Neon connection string before saving records.",
    );
  }
}
