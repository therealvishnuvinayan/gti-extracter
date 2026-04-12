import { NextResponse } from "next/server";
import { processNextBatchItem } from "@/lib/batches/process-next-item";
import { BatchServiceError } from "@/lib/batches/shared";
import {
  basicApiErrorSchema,
  processNextBatchItemApiSuccessSchema,
  type BasicApiError,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const payload: unknown = await request.json().catch(() => ({}));
    const debug =
      payload &&
      typeof payload === "object" &&
      "debug" in payload &&
      typeof payload.debug === "boolean"
        ? payload.debug
        : false;
    const result = await processNextBatchItem(id, { debug });

    return NextResponse.json(
      processNextBatchItemApiSuccessSchema.parse({
        success: true,
        batch: result.batch,
        item: result.item,
        record: result.record,
        document: result.document,
      }),
    );
  } catch (error) {
    const parsed = basicApiErrorSchema.safeParse(
      error instanceof Error
        ? {
            success: false,
            error: {
              message: error.message,
            },
          }
        : null,
    );

    return NextResponse.json(
      parsed.success
        ? parsed.data
        : ({
            success: false,
            error: {
              message: "The next batch item could not be processed.",
            },
          } satisfies BasicApiError),
      { status: error instanceof BatchServiceError ? error.status : 500 },
    );
  }
}
