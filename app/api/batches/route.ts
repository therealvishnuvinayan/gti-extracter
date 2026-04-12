import { NextResponse } from "next/server";
import { listRecentBatches } from "@/lib/batches/get-batch-progress";
import { BatchServiceError } from "@/lib/batches/shared";
import { batchListApiSuccessSchema, type BasicApiError } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  try {
    const batches = await listRecentBatches();

    return NextResponse.json(
      batchListApiSuccessSchema.parse({
        success: true,
        batches,
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
              : "Recent extraction batches could not be loaded.",
        },
      } satisfies BasicApiError,
      {
        status: error instanceof BatchServiceError ? error.status : 500,
      },
    );
  }
}
