import "server-only";

import { getPrismaClient } from "@/lib/prisma";
import { extractSingleFeedbackFile } from "@/lib/feedback-form-pipeline";
import { toFeedbackCreateData, serializeFeedbackRecord } from "@/lib/feedback-records";
import {
  claimNextBatchItem,
  isBatchTerminal,
  loadBatchWithItems,
  resetStaleProcessingItems,
  serializeBatch,
  serializeBatchItem,
  syncBatchState,
} from "@/lib/batches/shared";
import { readStoredUploadedFile, removeStoredUploadedFile } from "@/lib/batches/store-uploaded-file";
import type { ProcessedFeedbackDocument } from "@/lib/types";

export async function processNextBatchItem(
  batchId: string,
  options: { debug?: boolean } = {},
) {
  const prisma = getPrismaClient();
  const claimed = await prisma.$transaction(
    async (tx) => {
      await resetStaleProcessingItems(tx, batchId);

      const batch = await loadBatchWithItems(tx, batchId);

      if (isBatchTerminal(batch.status)) {
        return {
          batch,
          item: null,
        };
      }

      const hasInFlightItem = batch.items.some((item) => item.status === "processing");

      if (hasInFlightItem) {
        const syncedBatch = await syncBatchState(tx, batchId, {
          preferProcessing: true,
        });

        return {
          batch: syncedBatch,
          item: null,
        };
      }

      const item = await claimNextBatchItem(tx, batchId);
      const syncedBatch = await syncBatchState(tx, batchId, {
        preferProcessing: Boolean(item),
      });

      return {
        batch: syncedBatch,
        item,
      };
    },
    {
      maxWait: 15_000,
      timeout: 30_000,
    },
  );

  if (!claimed.item) {
    return {
      batch: serializeBatch(claimed.batch, claimed.batch.items),
      item: null,
      record: null,
      document: null,
    };
  }

  let processedDocument: ProcessedFeedbackDocument | null = null;
  let completedBatch;
  let completedItem;
  let savedRecord = null;

  try {
    if (!claimed.item.fileStoragePath) {
      throw new Error("The uploaded file is no longer available on the server.");
    }

    const bytes = await readStoredUploadedFile(claimed.item.fileStoragePath);
    processedDocument = await extractSingleFeedbackFile(
      {
        fileName: claimed.item.fileName,
        mimeType: claimed.item.mimeType || "application/pdf",
        bytes,
      },
      { debug: options.debug === true },
    );

    if (processedDocument.status !== "completed") {
      throw new Error(
        processedDocument.errorMessage ||
          "The GTI form could not be extracted with enough confidence.",
      );
    }

    const { batch, item, record } = await prisma.$transaction(
      async (tx) => {
        const feedback = await tx.feedback.create({
          data: toFeedbackCreateData(processedDocument as ProcessedFeedbackDocument),
        });

        const updatedItem = await tx.extractionBatchItem.update({
          where: {
            id: claimed.item!.id,
          },
          data: {
            status: "completed",
            errorMessage: null,
            feedbackId: feedback.id,
            sourceFileName:
              processedDocument?.normalized.sourceFileName ||
              processedDocument?.sourceFileName ||
              claimed.item!.fileName,
            finishedAt: new Date(),
            fileStoragePath: null,
          },
        });

        const syncedBatch = await syncBatchState(tx, batchId);

        return {
          batch: syncedBatch,
          item: updatedItem,
          record: serializeFeedbackRecord(feedback),
        };
      },
      {
        maxWait: 15_000,
        timeout: 30_000,
      },
    );

    completedBatch = batch;
    completedItem = item;
    savedRecord = record;
    try {
      await removeStoredUploadedFile(claimed.item.fileStoragePath);
    } catch {
      // Cleanup is best-effort. A saved completed record must remain completed.
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The file could not be processed successfully.";

    const failed = await prisma.$transaction(
      async (tx) => {
        const updatedItem = await tx.extractionBatchItem.update({
          where: {
            id: claimed.item!.id,
          },
          data: {
            status: "failed",
            errorMessage: processedDocument?.errorMessage?.trim() || message,
            finishedAt: new Date(),
          },
        });

        const syncedBatch = await syncBatchState(tx, batchId);

        return {
          batch: syncedBatch,
          item: updatedItem,
        };
      },
      {
        maxWait: 15_000,
        timeout: 30_000,
      },
    );

    completedBatch = failed.batch;
    completedItem = failed.item;
  }

  return {
    batch: serializeBatch(completedBatch, completedBatch.items),
    item: serializeBatchItem(completedItem),
    record: savedRecord,
    document: processedDocument,
  };
}
