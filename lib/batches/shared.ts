import "server-only";

import type {
  ExtractionBatch,
  ExtractionBatchItem,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import {
  extractionBatchItemSchema,
  extractionBatchSchema,
  type ExtractionBatchStatus,
  type PersistedExtractionBatch,
  type PersistedExtractionBatchItem,
} from "@/lib/types";

export const MAX_BATCH_UPLOAD_FILES = 150;
export const DEFAULT_RECORDS_PAGE_SIZE = 10;
export const MAX_RECORDS_PAGE_SIZE = 20;
export const DEFAULT_RECENT_BATCH_LIMIT = 6;
const STALE_PROCESSING_MINUTES = Number.parseInt(
  process.env.GTI_BATCH_STALE_MINUTES ?? "15",
  10,
);

export class BatchServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type PrismaBatchClient = PrismaClient | Prisma.TransactionClient;

export type BatchWithItems = Prisma.ExtractionBatchGetPayload<{
  include: {
    items: {
      orderBy: {
        queueOrder: "asc";
      };
    };
  };
}>;

export async function loadBatchWithItems(
  client: PrismaBatchClient,
  batchId: string,
) {
  const batch = await client.extractionBatch.findUnique({
    where: { id: batchId },
    include: {
      items: {
        orderBy: {
          queueOrder: "asc",
        },
      },
    },
  });

  if (!batch) {
    throw new BatchServiceError(404, "The requested extraction batch was not found.");
  }

  return batch;
}

export async function syncBatchState(
  client: PrismaBatchClient,
  batchId: string,
  options: {
    preferProcessing?: boolean;
  } = {},
) {
  const batch = await loadBatchWithItems(client, batchId);
  const summary = summarizeBatch(batch);
  const nextStatus = resolveBatchStatus({
    currentStatus: batch.status,
    ...summary,
    preferProcessing: options.preferProcessing === true,
  });

  if (
    batch.status !== nextStatus ||
    batch.totalFiles !== summary.totalFiles ||
    batch.processedFiles !== summary.processedFiles ||
    batch.successFiles !== summary.successFiles ||
    batch.failedFiles !== summary.failedFiles ||
    batch.cancelledFiles !== summary.cancelledFiles
  ) {
    await client.extractionBatch.update({
      where: { id: batchId },
      data: {
        status: nextStatus,
        totalFiles: summary.totalFiles,
        processedFiles: summary.processedFiles,
        successFiles: summary.successFiles,
        failedFiles: summary.failedFiles,
        cancelledFiles: summary.cancelledFiles,
      },
    });

    return loadBatchWithItems(client, batchId);
  }

  return batch;
}

export async function resetStaleProcessingItems(
  client: PrismaBatchClient,
  batchId: string,
) {
  const staleBefore = new Date(
    Date.now() - Math.max(STALE_PROCESSING_MINUTES, 1) * 60 * 1000,
  );

  await client.extractionBatchItem.updateMany({
    where: {
      batchId,
      status: "processing",
      startedAt: {
        lt: staleBefore,
      },
      feedbackId: null,
    },
    data: {
      status: "queued",
      errorMessage: "A previous processing attempt was interrupted. The file was re-queued.",
      startedAt: null,
      finishedAt: null,
    },
  });
}

export async function claimNextBatchItem(
  client: PrismaBatchClient,
  batchId: string,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const nextItem = await client.extractionBatchItem.findFirst({
      where: {
        batchId,
        status: "queued",
      },
      orderBy: {
        queueOrder: "asc",
      },
    });

    if (!nextItem) {
      return null;
    }

    const startedAt = new Date();
    const claimed = await client.extractionBatchItem.updateMany({
      where: {
        id: nextItem.id,
        status: "queued",
      },
      data: {
        status: "processing",
        startedAt,
        finishedAt: null,
        errorMessage: null,
      },
    });

    if (claimed.count === 1) {
      return client.extractionBatchItem.findUniqueOrThrow({
        where: { id: nextItem.id },
      });
    }
  }

  return null;
}

export function serializeBatchItem(
  item: ExtractionBatchItem,
): PersistedExtractionBatchItem {
  return extractionBatchItemSchema.parse({
    id: item.id,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    batchId: item.batchId,
    fileName: item.fileName,
    mimeType: item.mimeType,
    status: item.status,
    errorMessage: item.errorMessage,
    sourceFileName: item.sourceFileName,
    feedbackId: item.feedbackId,
    queueOrder: item.queueOrder,
    startedAt: item.startedAt ? item.startedAt.toISOString() : null,
    finishedAt: item.finishedAt ? item.finishedAt.toISOString() : null,
  });
}

export function serializeBatch(
  batch: ExtractionBatch,
  items: ExtractionBatchItem[],
): PersistedExtractionBatch {
  const summary = summarizeBatch({ ...batch, items });
  const currentItem = items.find((item) => item.status === "processing") ?? null;

  return extractionBatchSchema.parse({
    id: batch.id,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    status: resolveBatchStatus({
      currentStatus: batch.status,
      ...summary,
      preferProcessing: batch.status === "processing",
    }),
    totalFiles: summary.totalFiles,
    processedFiles: summary.processedFiles,
    successFiles: summary.successFiles,
    failedFiles: summary.failedFiles,
    cancelledFiles: summary.cancelledFiles,
    queuedFiles: summary.queuedFiles,
    processingFiles: summary.processingFiles,
    completedFiles: summary.completedFiles,
    completionRatio:
      summary.totalFiles === 0 ? 0 : summary.processedFiles / summary.totalFiles,
    currentItemId: currentItem?.id ?? null,
    currentFileName: currentItem?.fileName ?? null,
  });
}

export function isBatchTerminal(status: ExtractionBatchStatus) {
  return (
    status === "completed" ||
    status === "partial" ||
    status === "cancelled" ||
    status === "failed"
  );
}

export function resolvePaginationParams({
  page,
  pageSize,
}: {
  page: string | null;
  pageSize: string | null;
}) {
  const parsedPage = Number.parseInt(page ?? "", 10);
  const parsedPageSize = Number.parseInt(pageSize ?? "", 10);

  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize:
      Number.isFinite(parsedPageSize) && parsedPageSize > 0
        ? Math.min(parsedPageSize, MAX_RECORDS_PAGE_SIZE)
        : DEFAULT_RECORDS_PAGE_SIZE,
  };
}

function summarizeBatch(batch: BatchWithItems | (ExtractionBatch & { items: ExtractionBatchItem[] })) {
  const totalFiles = batch.items.length;
  const completedFiles = batch.items.filter((item) => item.status === "completed").length;
  const failedFiles = batch.items.filter((item) => item.status === "failed").length;
  const cancelledFiles = batch.items.filter((item) => item.status === "cancelled").length;
  const queuedFiles = batch.items.filter((item) => item.status === "queued").length;
  const processingFiles = batch.items.filter((item) => item.status === "processing").length;
  const successFiles = completedFiles;
  const processedFiles = completedFiles + failedFiles + cancelledFiles;

  return {
    totalFiles,
    completedFiles,
    successFiles,
    failedFiles,
    cancelledFiles,
    queuedFiles,
    processingFiles,
    processedFiles,
  };
}

function resolveBatchStatus({
  currentStatus,
  totalFiles,
  completedFiles,
  failedFiles,
  cancelledFiles,
  queuedFiles,
  processingFiles,
  preferProcessing,
}: {
  currentStatus: ExtractionBatch["status"];
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  cancelledFiles: number;
  queuedFiles: number;
  processingFiles: number;
  preferProcessing: boolean;
}): ExtractionBatchStatus {
  if (processingFiles > 0) {
    return "processing";
  }

  if (totalFiles === 0) {
    return "failed";
  }

  if (completedFiles === totalFiles) {
    return "completed";
  }

  if (queuedFiles === totalFiles) {
    return preferProcessing ? "processing" : "queued";
  }

  if (queuedFiles > 0) {
    return preferProcessing ? "processing" : "queued";
  }

  if (cancelledFiles === totalFiles) {
    return "cancelled";
  }

  if (failedFiles === totalFiles) {
    return "failed";
  }

  if (completedFiles > 0 && (failedFiles > 0 || cancelledFiles > 0)) {
    return "partial";
  }

  if (failedFiles > 0 || cancelledFiles > 0) {
    return "partial";
  }

  return currentStatus === "processing" ? "processing" : "queued";
}
