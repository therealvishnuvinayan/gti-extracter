import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DEFAULT_UPLOAD_ROOT = path.join(os.tmpdir(), "gti-uploads");

export async function storeUploadedFile({
  batchId,
  fileName,
  bytes,
  queueOrder,
}: {
  batchId: string;
  fileName: string;
  bytes: Buffer;
  queueOrder: number;
}) {
  const batchDirectory = path.join(resolveUploadRoot(), batchId);
  await mkdir(batchDirectory, { recursive: true });

  const safeFileName = sanitizeFileName(fileName);
  const fileStoragePath = path.join(
    batchDirectory,
    `${String(queueOrder + 1).padStart(4, "0")}-${randomUUID()}-${safeFileName}`,
  );

  await writeFile(fileStoragePath, bytes);

  return fileStoragePath;
}

export async function readStoredUploadedFile(fileStoragePath: string) {
  return readFile(fileStoragePath);
}

export async function removeStoredUploadedFile(fileStoragePath: string) {
  if (!fileStoragePath) {
    return;
  }

  await rm(fileStoragePath, { force: true });
}

function resolveUploadRoot() {
  return process.env.GTI_UPLOAD_DIR?.trim() || DEFAULT_UPLOAD_ROOT;
}

function sanitizeFileName(fileName: string) {
  const cleaned = path.basename(fileName).replace(/[^a-zA-Z0-9._-]+/g, "-");
  return cleaned.length > 0 ? cleaned : "upload.pdf";
}
