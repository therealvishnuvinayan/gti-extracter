import "server-only";

import { getPrismaClient } from "@/lib/prisma";
import {
  DEFAULT_RECENT_BATCH_LIMIT,
  serializeBatch,
  serializeBatchItem,
  syncBatchState,
} from "@/lib/batches/shared";

export async function getBatchProgress(batchId: string) {
  const prisma = getPrismaClient();
  const batch = await syncBatchState(prisma, batchId);

  return {
    batch: serializeBatch(batch, batch.items),
    items: batch.items.map(serializeBatchItem),
  };
}

export async function listRecentBatches(limit = DEFAULT_RECENT_BATCH_LIMIT) {
  const prisma = getPrismaClient();
  const recentBatches = await prisma.extractionBatch.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: Math.max(1, limit),
  });

  const batches = await Promise.all(
    recentBatches.map((batch) => syncBatchState(prisma, batch.id)),
  );

  return batches.map((batch) => serializeBatch(batch, batch.items));
}
