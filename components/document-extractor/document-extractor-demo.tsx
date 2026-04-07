"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RecordsTable } from "@/components/records-table";
import { FilePreviewPanel } from "@/components/document-extractor/file-preview-panel";
import { HeroSection } from "@/components/document-extractor/hero-section";
import { PageShell } from "@/components/document-extractor/page-shell";
import { ProcessActionBar } from "@/components/document-extractor/process-action-bar";
import { ResultTabs } from "@/components/document-extractor/result-tabs";
import { UploadDropzone } from "@/components/document-extractor/upload-dropzone";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadExtractionExcel } from "@/lib/export-excel";
import { formatExtractionSummary } from "@/lib/format-extraction-summary";
import {
  basicApiErrorSchema,
  extractApiErrorSchema,
  extractApiSuccessSchema,
  resolveSupportedFileType,
  type ExtractionBatchResult,
  type ProcessedFeedbackDocument,
  saveRecordsApiSuccessSchema,
} from "@/lib/types";

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
type SaveStatus = "idle" | "saving" | "saved" | "error";

export function DocumentExtractorDemo() {
  const [mode, setMode] = useState<DemoMode>("extract");
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([]);
  const [result, setResult] = useState<ExtractionBatchResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedCount, setLastSavedCount] = useState(0);
  const [recordsRefreshToken, setRecordsRefreshToken] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const requestAbortRef = useRef<AbortController | null>(null);
  const previousDocumentsRef = useRef<SelectedDocument[]>([]);
  const resultsRef = useRef<HTMLDivElement | null>(null);

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
      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }

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

  const cancelInFlightRequest = () => {
    if (requestAbortRef.current) {
      requestAbortRef.current.abort();
      requestAbortRef.current = null;
    }
  };

  const handleFilesSelect = (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    cancelInFlightRequest();

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
      setResult(null);
      setErrorMessage(null);
      setSaveStatus("idle");
      setLastSavedCount(0);
      setStatus("ready");
      toast.success("Forms queued", {
        description: `${addedCount} file${addedCount === 1 ? "" : "s"} added for processing.`,
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
    cancelInFlightRequest();

    let nextCount = 0;
    setSelectedDocuments((previous) => {
      const nextDocuments = previous.filter((document) => document.id !== id);
      nextCount = nextDocuments.length;
      return nextDocuments;
    });

    setResult(null);
    setErrorMessage(null);
    setSaveStatus("idle");
    setLastSavedCount(0);
    setStatus(nextCount > 0 ? "ready" : "idle");
  };

  const handleClearFiles = () => {
    cancelInFlightRequest();
    setSelectedDocuments([]);
    setResult(null);
    setErrorMessage(null);
    setSaveStatus("idle");
    setLastSavedCount(0);
    setStatus("idle");
    toast.message("Form queue cleared", {
      description: "The selected forms were removed.",
    });
  };

  const handleProcess = async () => {
    if (selectedDocuments.length === 0) {
      toast.error("Select forms first", {
        description: "Choose at least one completed form to continue.",
      });
      return;
    }

    cancelInFlightRequest();
    setResult(null);
    setErrorMessage(null);
    setStatus("processing");

    const abortController = new AbortController();
    requestAbortRef.current = abortController;

    try {
      const formData = new FormData();

      selectedDocuments.forEach((document) => {
        formData.append("files", document.file);
      });

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      const payload: unknown = await response.json().catch(() => null);
      const successResult = extractApiSuccessSchema.safeParse(payload);

      if (response.ok && successResult.success) {
        const nextResult = successResult.data.data;
        const completedCount = nextResult.summary.completedFiles;
        const failedCount = nextResult.summary.failedFiles;

        setResult(nextResult);
        setStatus("complete");
        setSaveStatus("idle");
        setLastSavedCount(0);

        const savedCount = await saveBatchToDatabase(nextResult, {
          notifyOnSuccess: false,
        });

        if (savedCount !== null) {
          if (failedCount === 0) {
            toast.success("Processing complete", {
              description: `${savedCount} record${savedCount === 1 ? "" : "s"} processed and saved successfully.`,
            });
          } else {
            toast.message("Processing finished", {
              description: `${completedCount} ready • ${failedCount} need review • ${savedCount} saved`,
            });
          }
        } else {
          toast.message("Processing finished", {
            description:
              failedCount === 0
                ? `${completedCount} ready. Save needs retry.`
                : `${completedCount} ready • ${failedCount} need review • save failed`,
          });
        }

        return;
      }

      const errorResult = extractApiErrorSchema.safeParse(payload);
      const message =
        errorResult.success
          ? errorResult.data.error.message
          : "The forms could not be processed. Please try again.";

      setStatus("error");
      setErrorMessage(message);
      toast.error("Processing failed", {
        description: message,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const message =
        "The request did not complete successfully. Please retry in a moment.";
      setStatus("error");
      setErrorMessage(message);
      toast.error("Network issue", {
        description: message,
      });
    } finally {
      requestAbortRef.current = null;
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
        description: "The latest records have been exported to Excel.",
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

  const handleSaveToDatabase = async () => {
    if (!result) {
      return;
    }

    await saveBatchToDatabase(result, {
      notifyOnSuccess: true,
    });
  };

  const handleClear = () => {
    cancelInFlightRequest();
    setSelectedDocuments([]);
    setResult(null);
    setErrorMessage(null);
    setSaveStatus("idle");
    setLastSavedCount(0);
    setStatus("idle");
    toast.message("Session cleared", {
      description: "Forms and results were removed.",
    });
  };

  const saveBatchToDatabase = async (
    batch: ExtractionBatchResult,
    options: { notifyOnSuccess: boolean },
  ) => {
    setSaveStatus("saving");

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      const payload: unknown = await response.json().catch(() => null);
      const parsedSuccess = saveRecordsApiSuccessSchema.safeParse(payload);

      if (response.ok && parsedSuccess.success) {
        setSaveStatus("saved");
        setLastSavedCount(parsedSuccess.data.savedCount);
        setRecordsRefreshToken((current) => current + 1);

        if (options.notifyOnSuccess) {
          toast.success("Saved successfully", {
            description: `${parsedSuccess.data.savedCount} record${parsedSuccess.data.savedCount === 1 ? "" : "s"} saved successfully.`,
          });
        }

        return parsedSuccess.data.savedCount;
      }

      const parsedError = basicApiErrorSchema.safeParse(payload);
      throw new Error(
        parsedError.success
          ? parsedError.data.error.message
          : "The records could not be saved right now.",
      );
    } catch (error) {
      setSaveStatus("error");
      setLastSavedCount(0);

      if (options.notifyOnSuccess) {
        toast.error("Save failed", {
          description:
            error instanceof Error
              ? error.message
              : "The records could not be saved right now.",
        });
      }

      return null;
    }
  };

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
                    saveStatus === "saved"
                      ? "success"
                      : saveStatus === "error"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {saveStatus === "saved"
                    ? `${lastSavedCount} saved`
                    : saveStatus === "saving"
                      ? "Saving records"
                      : saveStatus === "error"
                        ? "Save needs retry"
                        : "Ready for processing"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Manage incoming forms and saved records in one place.
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use Processing to capture new feedback forms and Records to review
                  saved results and export the latest data.
                </p>
              </div>
            </div>
            <TabsList>
              <TabsTrigger value="extract">Processing</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="extract">
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col gap-6 animate-fade-up">
              <UploadDropzone
                disabled={status === "processing" || saveStatus === "saving"}
                files={selectedDocuments}
                isDragActive={isDragActive}
                onClearFiles={handleClearFiles}
                onDragActiveChange={setIsDragActive}
                onFilesSelect={handleFilesSelect}
              />
              <FilePreviewPanel
                disabled={status === "processing" || saveStatus === "saving"}
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
              <div ref={resultsRef}>
                <ResultTabs
                  errorMessage={errorMessage}
                  isProcessing={status === "processing"}
                  onClear={handleClear}
                  onCopyDocument={handleCopyDocument}
                  onDownloadExcel={handleDownloadExcel}
                  onSaveToDatabase={handleSaveToDatabase}
                  result={result}
                  saveStatus={saveStatus}
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
