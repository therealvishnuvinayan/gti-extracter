import { NextResponse } from "next/server";
import { startExtractionBatch } from "@/lib/batches/start-batch";
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
    const started = await startExtractionBatch(id);

    return NextResponse.json(
      createBatchApiSuccessSchema.parse({
        success: true,
        batch: started.batch,
        items: started.items,
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
              : "The extraction batch could not be started.",
        },
      } satisfies BasicApiError,
      { status: error instanceof BatchServiceError ? error.status : 500 },
    );
  }
}
