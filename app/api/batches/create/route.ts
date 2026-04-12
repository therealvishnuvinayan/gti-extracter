import { NextResponse } from "next/server";
import { createExtractionBatch } from "@/lib/batches/create-batch";
import { BatchServiceError } from "@/lib/batches/shared";
import { createBatchApiSuccessSchema, type BasicApiError } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    const created = await createExtractionBatch(files);

    return NextResponse.json(
      createBatchApiSuccessSchema.parse({
        success: true,
        batch: created.batch,
        items: created.items,
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
              : "The extraction batch could not be created.",
        },
      } satisfies BasicApiError,
      {
        status: error instanceof BatchServiceError ? error.status : 500,
      },
    );
  }
}
