import "server-only";

import { getPrismaClient } from "@/lib/prisma";
import {
  serializeBatch,
  serializeBatchItem,
  syncBatchState,
} from "@/lib/batches/shared";

export async function cancelExtractionBatch(batchId: string) {
  const prisma = getPrismaClient();
  const batch = await prisma.$transaction(async (tx) => {
    await tx.extractionBatchItem.updateMany({
      where: {
        batchId,
        status: "queued",
      },
      data: {
        status: "cancelled",
        errorMessage: "Processing was cancelled before this file started.",
        finishedAt: new Date(),
      },
    });

    return syncBatchState(tx, batchId);
  });

  return {
    batch: serializeBatch(batch, batch.items),
    items: batch.items.map(serializeBatchItem),
  };
}
