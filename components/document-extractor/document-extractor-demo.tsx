"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BatchProgressCard } from "@/components/document-extractor/batch-progress-card";
import { FilePreviewPanel } from "@/components/document-extractor/file-preview-panel";
import { HeroSection } from "@/components/document-extractor/hero-section";
import { PageShell } from "@/components/document-extractor/page-shell";
import { ProcessActionBar } from "@/components/document-extractor/process-action-bar";
import { ResultTabs } from "@/components/document-extractor/result-tabs";
import { UploadDropzone } from "@/components/document-extractor/upload-dropzone";
import { RecordsTable } from "@/components/records-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadExtractionExcel } from "@/lib/export-excel";
import { formatExtractionSummary } from "@/lib/format-extraction-summary";
import {
  basicApiErrorSchema,
  batchItemsApiSuccessSchema,
  batchApiSuccessSchema,
  createBatchApiSuccessSchema,
  extractApiErrorSchema,
  resolveSupportedFileType,
  processNextBatchItemApiSuccessSchema,
  type ExtractionBatchResult,
  type PersistedExtractionBatch,
  type PersistedExtractionBatchItem,
  type ProcessedFeedbackDocument,
} from "@/lib/types";

const ACTIVE_BATCH_STORAGE_KEY = "gti-active-batch-id";

export type SelectedDocument = {
  id: string;
  file: File;
  kind: "image" | "pdf";
  previewUrl?: string;
};

export type ProcessingStatus =
  | "idle"
  | "ready"
  | "processing"
  | "complete"
  | "error";

type DemoMode = "extract" | "records";

export function DocumentExtractorDemo() {
  const [mode, setMode] = useState<DemoMode>("extract");
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([]);
  const [result, setResult] = useState<ExtractionBatchResult | null>(null);
  const [currentBatch, setCurrentBatch] = useState<PersistedExtractionBatch | null>(null);
  const [batchItems, setBatchItems] = useState<PersistedExtractionBatchItem[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isQueueWorking, setIsQueueWorking] = useState(false);
  const [recordsRefreshToken, setRecordsRefreshToken] = useState(0);
  const previousDocumentsRef = useRef<SelectedDocument[]>([]);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const activeRunIdRef = useRef(0);
  const activeQueueBatchIdRef = useRef<string | null>(null);
  const cancelRequestedRef = useRef(false);
  const restoreBatchFromStorageRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const previous = previousDocumentsRef.current;
    const nextIds = new Set(selectedDocuments.map((document) => document.id));

    previous
      .filter((document) => !nextIds.has(document.id))
      .forEach(revokePreviewUrl);

    previousDocumentsRef.current = selectedDocuments;
  }, [selectedDocuments]);

  useEffect(() => {
    return () => {
      activeRunIdRef.current += 1;
      cancelRequestedRef.current = true;
      previousDocumentsRef.current.forEach(revokePreviewUrl);
    };
  }, []);

  useEffect(() => {
    if (status === "complete" || status === "error") {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [status]);

  restoreBatchFromStorageRef.current = async () => {
    const persistedBatchId = readPersistedBatchId();

    if (!persistedBatchId) {
      return;
    }

    try {
      const snapshot = await fetchBatchSnapshot(persistedBatchId);

      if (!snapshot) {
        clearPersistedBatchId();
        return;
      }

      applyBatchSnapshot(snapshot.batch, snapshot.items);

      if (
        snapshot.batch.status === "queued" ||
        snapshot.batch.status === "processing"
      ) {
        await runBatchQueue(snapshot.batch.id);
      }
    } catch {
      // Ignore silent restore failures on load.
    }
  };

  useEffect(() => {
    void restoreBatchFromStorageRef.current();
  }, []);

  const handleFilesSelect = (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    let addedCount = 0;
    let duplicateCount = 0;
    let emptyCount = 0;
    let unsupportedCount = 0;

    setSelectedDocuments((previous) => {
      const seenIds = new Set(previous.map((document) => document.id));
      const nextDocuments = [...previous];

      files.forEach((file) => {
        if (file.size === 0) {
          emptyCount += 1;
          return;
        }

        const preparedDocument = prepareSelectedDocument(file);

        if (!preparedDocument) {
          unsupportedCount += 1;
          return;
        }

        if (seenIds.has(preparedDocument.id)) {
          duplicateCount += 1;
          revokePreviewUrl(preparedDocument);
          return;
        }

        seenIds.add(preparedDocument.id);
        nextDocuments.push(preparedDocument);
        addedCount += 1;
      });

      return nextDocuments;
    });

    if (addedCount > 0) {
      if (!currentBatch || isBatchTerminal(currentBatch.status)) {
        setResult(null);
      }
      setErrorMessage(null);
      if (!currentBatch || isBatchTerminal(currentBatch.status)) {
        setStatus("ready");
      }
      toast.success("Forms queued", {
        description: `${addedCount} file${addedCount === 1 ? "" : "s"} added to the next batch.`,
      });
    }

    if (duplicateCount > 0 || emptyCount > 0 || unsupportedCount > 0) {
      toast.message("Some files were skipped", {
        description: [
          duplicateCount > 0
            ? `${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"}`
            : "",
          emptyCount > 0 ? `${emptyCount} empty` : "",
          unsupportedCount > 0 ? `${unsupportedCount} unsupported` : "",
        ]
          .filter(Boolean)
          .join(" • "),
      });
    }
  };

  const handleRemoveFile = (id: string) => {
    let nextCount = 0;

    setSelectedDocuments((previous) => {
      const nextDocuments = previous.filter((document) => document.id !== id);
      nextCount = nextDocuments.length;
      return nextDocuments;
    });

    if (!currentBatch || isBatchTerminal(currentBatch.status)) {
      setResult(null);
      setErrorMessage(null);
      setStatus(nextCount > 0 ? "ready" : "idle");
    }
  };

  const handleClearFiles = () => {
    setSelectedDocuments([]);

    if (!currentBatch || isBatchTerminal(currentBatch.status)) {
      setResult(null);
      setErrorMessage(null);
      setStatus("idle");
    }

    toast.message("Uploads cleared", {
      description: "The local upload selection was removed.",
    });
  };

  const handleProcess = async () => {
    if (selectedDocuments.length === 0) {
      toast.error("Select forms first", {
        description: "Choose at least one completed GTI form to continue.",
      });
      return;
    }

    if (currentBatch && !isBatchTerminal(currentBatch.status)) {
      toast.error("Batch already in progress", {
        description: "Finish or cancel the current queue before starting another batch.",
      });
      return;
    }

    setErrorMessage(null);
    setStatus("processing");
    setResult(null);
    setIsQueueWorking(true);
    cancelRequestedRef.current = false;

    try {
      const formData = new FormData();

      selectedDocuments.forEach((document) => {
        formData.append("files", document.file);
      });

      const response = await fetch("/api/batches/create", {
        method: "POST",
        body: formData,
      });
      const payload: unknown = await response.json().catch(() => null);
      const parsedSuccess = createBatchApiSuccessSchema.safeParse(payload);

      if (response.ok && parsedSuccess.success) {
        const { batch, items } = parsedSuccess.data;
        setCurrentBatch(batch);
        setBatchItems(items);
        persistActiveBatchId(batch.id);
        toast.success("Batch created", {
          description: `${batch.totalFiles} file${batch.totalFiles === 1 ? "" : "s"} added to the persisted queue.`,
        });

        await runBatchQueue(batch.id);
        return;
      }

      throw new Error(resolveApiErrorMessage(payload, "The batch could not be created."));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The batch could not be created right now.";
      setStatus("error");
      setErrorMessage(message);
      toast.error("Batch creation failed", {
        description: message,
      });
    } finally {
      setIsQueueWorking(false);
    }
  };

  const handleRefreshBatch = async () => {
    if (!currentBatch) {
      await restoreBatchFromStorageRef.current();
      return;
    }

    const snapshot = await fetchBatchSnapshot(currentBatch.id);

    if (!snapshot) {
      return;
    }

    applyBatchSnapshot(snapshot.batch, snapshot.items);
    toast.success("Batch refreshed", {
      description: "Latest queue progress has been loaded from the database.",
    });
  };

  const handleResumeBatch = async () => {
    if (!currentBatch) {
      return;
    }

    await runBatchQueue(currentBatch.id);
  };

  const handleCancelBatch = async () => {
    if (!currentBatch) {
      return;
    }

    const batchId = currentBatch.id;
    cancelRequestedRef.current = true;
    activeRunIdRef.current += 1;
    setIsQueueWorking(false);

    try {
      const response = await fetch(`/api/batches/${batchId}/cancel`, {
        method: "POST",
      });
      const payload: unknown = await response.json().catch(() => null);
      const parsedSuccess = createBatchApiSuccessSchema.safeParse(payload);

      if (response.ok && parsedSuccess.success) {
        clearPersistedBatchId();
        setCurrentBatch(null);
        setBatchItems([]);
        setSelectedDocuments([]);
        setResult(null);
        setErrorMessage(null);
        setStatus("idle");
        toast.message("Batch cancelled", {
          description:
            "Queue stopped. Finished records remain saved, and the workspace is ready for a new upload.",
        });
        return;
      }

      throw new Error(resolveApiErrorMessage(payload, "The batch could not be cancelled."));
    } catch (error) {
      toast.error("Cancel failed", {
        description:
          error instanceof Error
            ? error.message
            : "The batch could not be cancelled right now.",
      });
    }
  };

  const handleDownloadBatchExcel = async () => {
    if (!currentBatch) {
      return;
    }

    try {
      const response = await fetch(`/api/batches/${currentBatch.id}/export`, {
        method: "GET",
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        throw new Error(
          resolveApiErrorMessage(payload, "The batch export could not be generated."),
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `gti-batch-${currentBatch.id}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);

      toast.success("Batch Excel downloaded", {
        description: "The completed records for this batch were exported.",
      });
    } catch (error) {
      toast.error("Batch export failed", {
        description:
          error instanceof Error
            ? error.message
            : "The batch export could not be generated.",
      });
    }
  };

  const handleCopyDocument = async (document: ProcessedFeedbackDocument) => {
    try {
      await navigator.clipboard.writeText(formatExtractionSummary(document));
      toast.success("Record copied", {
        description: "The selected record was copied to the clipboard.",
      });
    } catch {
      toast.error("Copy failed", {
        description: "Clipboard access is not available in this browser.",
      });
    }
  };

  const handleDownloadExcel = async () => {
    if (!result) {
      return;
    }

    try {
      await downloadExtractionExcel({ result });
      toast.success("Excel downloaded", {
        description: "The processed preview records were exported to Excel.",
      });
    } catch (error) {
      toast.error("Excel export failed", {
        description:
          error instanceof Error
            ? error.message
            : "The spreadsheet could not be generated.",
      });
    }
  };

  const handleClear = () => {
    setSelectedDocuments([]);
    setResult(null);
    setErrorMessage(null);

    if (!currentBatch || isBatchTerminal(currentBatch.status)) {
      setCurrentBatch(null);
      setBatchItems([]);
      clearPersistedBatchId();
      setStatus("idle");
    }

    toast.message("Workspace cleared", {
      description:
        currentBatch && !isBatchTerminal(currentBatch.status)
          ? "Local uploads and preview were cleared. The persisted batch remains active."
          : "Local uploads and preview were cleared.",
    });
  };

  async function runBatchQueue(batchId: string) {
    if (activeQueueBatchIdRef.current === batchId && activeRunIdRef.current !== 0) {
      return;
    }

    const runId = Date.now();
    activeRunIdRef.current = runId;
    activeQueueBatchIdRef.current = batchId;
    cancelRequestedRef.current = false;
    setIsQueueWorking(true);
    setStatus("processing");
    setErrorMessage(null);

    try {
      const startResponse = await fetch(`/api/batches/${batchId}/start`, {
        method: "POST",
      });
      const startPayload: unknown = await startResponse.json().catch(() => null);
      const startResult = createBatchApiSuccessSchema.safeParse(startPayload);

      if (activeRunIdRef.current !== runId) {
        return;
      }

      if (!startResponse.ok || !startResult.success) {
        throw new Error(
          resolveApiErrorMessage(startPayload, "The batch queue could not be started."),
        );
      }

      applyBatchSnapshot(startResult.data.batch, startResult.data.items);

      while (activeRunIdRef.current === runId) {
        const response = await fetch(`/api/batches/${batchId}/process-next`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        const payload: unknown = await response.json().catch(() => null);
        const parsed = processNextBatchItemApiSuccessSchema.safeParse(payload);

        if (activeRunIdRef.current !== runId) {
          return;
        }

        if (!response.ok || !parsed.success) {
          throw new Error(
            resolveApiErrorMessage(payload, "The batch queue could not continue."),
          );
        }

        const next = parsed.data;
        setCurrentBatch(next.batch);
        setBatchItems((current) =>
          next.item ? replaceBatchItem(current, next.item) : current,
        );

        if (next.record) {
          setRecordsRefreshToken((current) => current + 1);
        }

        if (next.document) {
          setResult((current) => mergeDocumentIntoResult(current, next.document!));
        }

        if (isBatchTerminal(next.batch.status)) {
          const snapshot = await fetchBatchSnapshot(batchId);

          if (snapshot) {
            applyBatchSnapshot(snapshot.batch, snapshot.items);
          }

          break;
        }

        if (cancelRequestedRef.current && next.batch.processingFiles === 0) {
          const snapshot = await fetchBatchSnapshot(batchId);

          if (snapshot) {
            applyBatchSnapshot(snapshot.batch, snapshot.items);
          }

          break;
        }

        if (next.item === null && next.batch.status === "processing") {
          await delay(1200);
          const snapshot = await fetchBatchSnapshot(batchId);

          if (snapshot) {
            applyBatchSnapshot(snapshot.batch, snapshot.items);
          }
        }
      }

      if (activeRunIdRef.current !== runId) {
        return;
      }

      const snapshot = await fetchBatchSnapshot(batchId);

      if (activeRunIdRef.current !== runId) {
        return;
      }

      if (snapshot) {
        applyBatchSnapshot(snapshot.batch, snapshot.items);

        if (snapshot.batch.status === "completed") {
          toast.success("Batch complete", {
            description: `${snapshot.batch.successFiles} record${snapshot.batch.successFiles === 1 ? "" : "s"} processed and saved.`,
          });
        } else if (snapshot.batch.status === "partial") {
          toast.message("Batch finished with partial success", {
            description: `${snapshot.batch.successFiles} completed • ${snapshot.batch.failedFiles} failed • ${snapshot.batch.cancelledFiles} cancelled`,
          });
        } else if (snapshot.batch.status === "cancelled") {
          toast.message("Batch stopped", {
            description: "Completed files remain saved and pending files can be resumed later.",
          });
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The queue did not complete successfully.";
      setErrorMessage(message);
      setStatus("error");
      toast.error("Batch processing failed", {
        description: message,
      });
    } finally {
      if (activeRunIdRef.current === runId) {
        activeRunIdRef.current = 0;
      }
      if (activeQueueBatchIdRef.current === batchId) {
        activeQueueBatchIdRef.current = null;
      }
      cancelRequestedRef.current = false;
      setIsQueueWorking(false);
    }
  }

  async function fetchBatchSnapshot(batchId: string) {
    try {
      const [batchResponse, itemsResponse] = await Promise.all([
        fetch(`/api/batches/${batchId}`, {
          method: "GET",
          cache: "no-store",
        }),
        fetch(`/api/batches/${batchId}/items`, {
          method: "GET",
          cache: "no-store",
        }),
      ]);
      const [batchPayload, itemsPayload] = await Promise.all([
        batchResponse.json().catch(() => null),
        itemsResponse.json().catch(() => null),
      ]);
      const parsedBatch = batchApiSuccessSchema.safeParse(batchPayload);
      const parsedItems = batchItemsApiSuccessSchema.safeParse(itemsPayload);

      if (
        !batchResponse.ok ||
        !itemsResponse.ok ||
        !parsedBatch.success ||
        !parsedItems.success
      ) {
        return null;
      }

      return {
        batch: parsedBatch.data.batch,
        items: parsedItems.data.items,
      };
    } catch {
      return null;
    }
  }

  function applyBatchSnapshot(
    batch: PersistedExtractionBatch,
    items: PersistedExtractionBatchItem[],
  ) {
    setCurrentBatch(batch);
    setBatchItems(items);

    if (batch.status === "cancelled") {
      clearPersistedBatchId();
    } else {
      persistActiveBatchId(batch.id);
    }

    if (batch.status === "completed" || batch.status === "partial" || batch.status === "cancelled") {
      setStatus("complete");
    } else if (batch.status === "failed") {
      setStatus("error");
    } else {
      setStatus("processing");
    }
  }

  const previewSaveStatus =
    currentBatch?.successFiles && currentBatch.successFiles > 0 ? "saved" : "idle";

  return (
    <PageShell>
      <HeroSection />

      <Tabs
        className="animate-fade-up [animation-delay:80ms]"
        onValueChange={(value) => setMode(value as DemoMode)}
        value={mode}
      >
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Feedback Workspace</Badge>
                <Badge
                  variant={
                    currentBatch?.status === "completed"
                      ? "success"
                      : currentBatch?.status === "processing"
                        ? "default"
                        : currentBatch?.status === "partial" || currentBatch?.status === "failed"
                          ? "destructive"
                          : "outline"
                  }
                >
                  {currentBatch
                    ? `${formatBatchStatus(currentBatch.status)} batch`
                    : "Ready for queue"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Manage GTI batch extraction and saved records in one place.
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Uploaded files are stored on the server, processed one by one, and
                  saved immediately after each successful extraction.
                </p>
              </div>
            </div>
            <TabsList>
              <TabsTrigger value="extract">Extract</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="extract">
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col gap-6 animate-fade-up">
              <UploadDropzone
                disabled={isQueueWorking}
                files={selectedDocuments}
                isDragActive={isDragActive}
                onClearFiles={handleClearFiles}
                onDragActiveChange={setIsDragActive}
                onFilesSelect={handleFilesSelect}
              />
              <FilePreviewPanel
                disabled={isQueueWorking}
                files={selectedDocuments}
                onRemoveFile={handleRemoveFile}
                result={result}
              />
            </div>

            <div className="flex flex-col gap-6 animate-fade-up [animation-delay:120ms]">
              <ProcessActionBar
                documentCount={selectedDocuments.length}
                errorMessage={errorMessage}
                onProcess={handleProcess}
                status={status}
              />
              <BatchProgressCard
                batch={currentBatch}
                isWorking={isQueueWorking}
                items={batchItems}
                onCancel={() => void handleCancelBatch()}
                onDownloadExcel={() => void handleDownloadBatchExcel()}
                onRefresh={() => void handleRefreshBatch()}
                onResume={() => void handleResumeBatch()}
              />
              <div ref={resultsRef}>
                <ResultTabs
                  errorMessage={errorMessage}
                  isProcessing={isQueueWorking && !result}
                  onClear={handleClear}
                  onCopyDocument={handleCopyDocument}
                  onDownloadExcel={handleDownloadExcel}
                  result={result}
                  saveStatus={previewSaveStatus}
                />
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="records">
          <RecordsTable isActive={mode === "records"} refreshToken={recordsRefreshToken} />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function prepareSelectedDocument(file: File): SelectedDocument | null {
  const resolvedMimeType = resolveSupportedFileType(file.name, file.type);

  if (!resolvedMimeType) {
    return null;
  }

  return {
    id: getFileFingerprint(file),
    file,
    kind: resolvedMimeType === "application/pdf" ? "pdf" : "image",
    previewUrl:
      resolvedMimeType === "application/pdf" ? undefined : URL.createObjectURL(file),
  };
}

function getFileFingerprint(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function revokePreviewUrl(document: SelectedDocument) {
  if (document.previewUrl) {
    URL.revokeObjectURL(document.previewUrl);
  }
}

function replaceBatchItem(
  currentItems: PersistedExtractionBatchItem[],
  nextItem: PersistedExtractionBatchItem,
) {
  const hasExistingItem = currentItems.some((item) => item.id === nextItem.id);

  if (!hasExistingItem) {
    return [...currentItems, nextItem].sort((left, right) => left.queueOrder - right.queueOrder);
  }

  return currentItems
    .map((item) => (item.id === nextItem.id ? nextItem : item))
    .sort((left, right) => left.queueOrder - right.queueOrder);
}

function mergeDocumentIntoResult(
  current: ExtractionBatchResult | null,
  document: ProcessedFeedbackDocument,
): ExtractionBatchResult {
  const existingDocuments = current?.documents ?? [];
  const nextDocuments = [...existingDocuments];
  const existingIndex = nextDocuments.findIndex(
    (currentDocument) => currentDocument.sourceFileName === document.sourceFileName,
  );

  if (existingIndex >= 0) {
    nextDocuments[existingIndex] = document;
  } else {
    nextDocuments.push(document);
  }

  return {
    documents: nextDocuments,
    summary: {
      totalFiles: nextDocuments.length,
      completedFiles: nextDocuments.filter((item) => item.status === "completed").length,
      failedFiles: nextDocuments.filter((item) => item.status === "failed").length,
      totalPages: nextDocuments.reduce((total, item) => total + item.pageCount, 0),
    },
  };
}

function resolveApiErrorMessage(payload: unknown, fallbackMessage: string) {
  const parsed = basicApiErrorSchema.safeParse(payload);

  if (parsed.success) {
    return parsed.data.error.message;
  }

  const extractParsed = extractApiErrorSchema.safeParse(payload);
  return extractParsed.success ? extractParsed.data.error.message : fallbackMessage;
}

function isBatchTerminal(status: PersistedExtractionBatch["status"]) {
  return (
    status === "completed" ||
    status === "partial" ||
    status === "cancelled" ||
    status === "failed"
  );
}

function formatBatchStatus(status: PersistedExtractionBatch["status"]) {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "partial":
      return "Partial";
    case "cancelled":
      return "Cancelled";
    case "failed":
      return "Failed";
  }
}

function persistActiveBatchId(batchId: string) {
  window.localStorage.setItem(ACTIVE_BATCH_STORAGE_KEY, batchId);
}

function readPersistedBatchId() {
  return window.localStorage.getItem(ACTIVE_BATCH_STORAGE_KEY);
}

function clearPersistedBatchId() {
  window.localStorage.removeItem(ACTIVE_BATCH_STORAGE_KEY);
}

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}
