import { NextResponse } from "next/server";
import { getBatchProgress } from "@/lib/batches/get-batch-progress";
import { BatchServiceError } from "@/lib/batches/shared";
import { batchItemsApiSuccessSchema, type BasicApiError } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const batch = await getBatchProgress(id);

    return NextResponse.json(
      batchItemsApiSuccessSchema.parse({
        success: true,
        items: batch.items,
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
              : "The batch queue items could not be loaded.",
        },
      } satisfies BasicApiError,
      { status: error instanceof BatchServiceError ? error.status : 500 },
    );
  }
}
