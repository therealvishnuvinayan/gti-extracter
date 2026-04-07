"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FilePreviewPanel } from "@/components/document-extractor/file-preview-panel";
import { HeroSection } from "@/components/document-extractor/hero-section";
import { PageShell } from "@/components/document-extractor/page-shell";
import { ProcessActionBar } from "@/components/document-extractor/process-action-bar";
import { ResultTabs } from "@/components/document-extractor/result-tabs";
import { TemplateWorkbookPanel } from "@/components/document-extractor/template-workbook-panel";
import { UploadDropzone } from "@/components/document-extractor/upload-dropzone";
import { downloadExtractionExcel } from "@/lib/export-excel";
import { formatExtractionSummary } from "@/lib/format-extraction-summary";
import { downloadExtractionJson } from "@/lib/export-json";
import {
  extractApiErrorSchema,
  extractApiSuccessSchema,
  resolveSupportedFileType,
  resolveTemplateWorkbookType,
  type ExtractionBatchResult,
  type ProcessedFeedbackDocument,
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

export function DocumentExtractorDemo() {
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([]);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractionBatchResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
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
      setStatus("ready");
      toast.success("Forms queued", {
        description: `${addedCount} file${addedCount === 1 ? "" : "s"} added to the extraction batch.`,
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
    setStatus(nextCount > 0 ? "ready" : "idle");
  };

  const handleClearFiles = () => {
    cancelInFlightRequest();
    setSelectedDocuments([]);
    setResult(null);
    setErrorMessage(null);
    setStatus("idle");
    toast.message("Form queue cleared", {
      description: "The selected forms were removed. The template workbook stays loaded.",
    });
  };

  const handleTemplateSelect = (file: File) => {
    const templateMimeType = resolveTemplateWorkbookType(file.name, file.type);

    if (!templateMimeType) {
      toast.error("Unsupported template", {
        description: "Upload the GTI workbook in .xlsx format.",
      });
      return;
    }

    setTemplateFile(file);
    toast.success("Template ready", {
      description: "Excel exports will follow the uploaded workbook structure.",
    });
  };

  const handleRemoveTemplate = () => {
    setTemplateFile(null);
    toast.message("Template removed", {
      description: "Excel exports will fall back to normalized schema headers.",
    });
  };

  const handleProcess = async () => {
    if (selectedDocuments.length === 0) {
      toast.error("Select forms first", {
        description: "Choose at least one file so the demo has something to process.",
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

        if (failedCount === 0) {
          toast.success("Batch extraction complete", {
            description: `${completedCount} file${completedCount === 1 ? "" : "s"} normalized and ready for export.`,
          });
        } else {
          toast.message("Batch extraction finished", {
            description: `${completedCount} completed • ${failedCount} need review`,
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
      toast.error("Extraction failed", {
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
        description: "The active normalized record was copied to the clipboard.",
      });
    } catch {
      toast.error("Copy failed", {
        description: "Clipboard access is not available in this browser.",
      });
    }
  };

  const handleDownloadJson = () => {
    if (!result) {
      return;
    }

    downloadExtractionJson(result);
    toast.success("JSON downloaded", {
      description: "The full batch extraction response has been downloaded.",
    });
  };

  const handleDownloadExcel = async () => {
    if (!result) {
      return;
    }

    try {
      await downloadExtractionExcel({
        result,
        templateFile,
      });
      toast.success("Excel downloaded", {
        description: templateFile
          ? "Rows were written using the uploaded GTI workbook template."
          : "A fallback workbook was generated using the normalized schema headers.",
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
    cancelInFlightRequest();
    setSelectedDocuments([]);
    setResult(null);
    setErrorMessage(null);
    setStatus("idle");
    toast.message("Session cleared", {
      description: "Forms and results were removed. The template workbook stays available.",
    });
  };

  return (
    <PageShell>
      <HeroSection />

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-6 animate-fade-up">
          <UploadDropzone
            disabled={status === "processing"}
            files={selectedDocuments}
            isDragActive={isDragActive}
            onClearFiles={handleClearFiles}
            onDragActiveChange={setIsDragActive}
            onFilesSelect={handleFilesSelect}
          />
          <TemplateWorkbookPanel
            disabled={status === "processing"}
            file={templateFile}
            onRemove={handleRemoveTemplate}
            onSelect={handleTemplateSelect}
          />
          <FilePreviewPanel
            disabled={status === "processing"}
            files={selectedDocuments}
            onRemoveFile={handleRemoveFile}
            result={result}
          />
        </div>

        <div className="flex flex-col gap-6 animate-fade-up [animation-delay:120ms]">
          <ProcessActionBar
            documentCount={selectedDocuments.length}
            errorMessage={errorMessage}
            hasTemplate={Boolean(templateFile)}
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
              onDownloadJson={handleDownloadJson}
              result={result}
              templateReady={Boolean(templateFile)}
            />
          </div>
        </div>
      </section>
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
