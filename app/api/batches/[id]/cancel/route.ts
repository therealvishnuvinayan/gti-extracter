import { NextResponse } from "next/server";
import { cancelExtractionBatch } from "@/lib/batches/cancel-batch";
import { BatchServiceError } from "@/lib/batches/shared";
import { createBatchApiSuccessSchema, type BasicApiError } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const cancelled = await cancelExtractionBatch(id);

    return NextResponse.json(
      createBatchApiSuccessSchema.parse({
        success: true,
        batch: cancelled.batch,
        items: cancelled.items,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof BatchServiceError || error instanceof Error
              ? error.message
              : "The extraction batch could not be cancelled.",
        },
      } satisfies BasicApiError,
      { status: error instanceof BatchServiceError ? error.status : 500 },
    );
  }
}
