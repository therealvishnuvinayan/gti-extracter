import "server-only";

import { getPrismaClient } from "@/lib/prisma";
import { resolveSupportedFileType } from "@/lib/types";
import { MAX_BATCH_UPLOAD_FILES, serializeBatch, serializeBatchItem, BatchServiceError } from "@/lib/batches/shared";

export async function createExtractionBatch(files: File[]) {
  if (files.length === 0) {
    throw new BatchServiceError(
      400,
      "Choose at least one scanned GTI feedback form before creating a batch.",
    );
  }

  if (files.length > MAX_BATCH_UPLOAD_FILES) {
    throw new BatchServiceError(
      400,
      `Upload up to ${MAX_BATCH_UPLOAD_FILES} files per batch.`,
    );
  }

  const prisma = getPrismaClient();
  const batch = await prisma.extractionBatch.create({
    data: {
      status: "queued",
      totalFiles: files.length,
    },
  });

  try {
    const itemRows = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];

      if (file.size === 0) {
        throw new BatchServiceError(
          400,
          `The file "${file.name}" is empty. Upload a valid PDF or image.`,
        );
      }

      const mimeType = resolveSupportedFileType(file.name, file.type);

      if (!mimeType) {
        throw new BatchServiceError(
          415,
          `The file "${file.name}" is not supported. Use JPG, PNG, WEBP, or PDF.`,
        );
      }

      const fileBytes = Buffer.from(await file.arrayBuffer());
      itemRows.push({
        batchId: batch.id,
        fileName: file.name,
        mimeType,
        status: "queued" as const,
        fileStoragePath: null,
        fileBytes,
        queueOrder: index,
      });
    }

    await prisma.extractionBatchItem.createMany({
      data: itemRows,
    });

    const batchWithItems = await prisma.extractionBatch.findUniqueOrThrow({
      where: { id: batch.id },
      include: {
        items: {
          orderBy: {
            queueOrder: "asc",
          },
        },
      },
    });

    return {
      batch: serializeBatch(batchWithItems, batchWithItems.items),
      items: batchWithItems.items.map(serializeBatchItem),
    };
  } catch (error) {
    await prisma.extractionBatch.delete({
      where: { id: batch.id },
    }).catch(() => undefined);

    throw error;
  }
}
