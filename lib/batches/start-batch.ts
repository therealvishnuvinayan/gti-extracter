import "server-only";

import { getOpenAIClient } from "@/lib/openai";
import { getPrismaClient } from "@/lib/prisma";
import {
  loadBatchWithItems,
  resetStaleProcessingItems,
  serializeBatch,
  serializeBatchItem,
  syncBatchState,
} from "@/lib/batches/shared";

export async function startExtractionBatch(batchId: string) {
  getOpenAIClient();

  const prisma = getPrismaClient();
  const batch = await prisma.$transaction(async (tx) => {
    await resetStaleProcessingItems(tx, batchId);

    const existing = await loadBatchWithItems(tx, batchId);
    const hasCancelledPendingItems = existing.items.some(
      (item) => item.status === "cancelled" && !item.feedbackId,
    );

    if (hasCancelledPendingItems) {
      await tx.extractionBatchItem.updateMany({
        where: {
          batchId,
          status: "cancelled",
          feedbackId: null,
        },
        data: {
          status: "queued",
          errorMessage: null,
          startedAt: null,
          finishedAt: null,
        },
      });
    }

    const synced = await syncBatchState(tx, batchId, {
      preferProcessing:
        hasCancelledPendingItems ||
        existing.items.some((item) => item.status === "queued"),
    });

    return synced;
  });

  return {
    batch: serializeBatch(batch, batch.items),
    items: batch.items.map(serializeBatchItem),
  };
}
