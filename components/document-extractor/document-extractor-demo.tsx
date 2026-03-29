"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FilePreviewPanel } from "@/components/document-extractor/file-preview-panel";
import { HeroSection } from "@/components/document-extractor/hero-section";
import { PageShell } from "@/components/document-extractor/page-shell";
import { ProcessActionBar } from "@/components/document-extractor/process-action-bar";
import { ResultTabs } from "@/components/document-extractor/result-tabs";
import { UploadDropzone } from "@/components/document-extractor/upload-dropzone";
import { downloadExtractionExcel } from "@/lib/export-excel";
import { formatExtractionSummary } from "@/lib/format-extraction-summary";
import { downloadExtractionJson } from "@/lib/export-json";
import {
  extractApiErrorSchema,
  extractApiSuccessSchema,
  resolveSupportedFileType,
  type ExtractionResult,
} from "@/lib/types";

export type SelectedDocument = {
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
  const [selectedDocument, setSelectedDocument] = useState<SelectedDocument | null>(
    null,
  );
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const requestAbortRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (selectedDocument?.previewUrl) {
        URL.revokeObjectURL(selectedDocument.previewUrl);
      }
    };
  }, [selectedDocument]);

  useEffect(() => {
    return () => {
      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }
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

  const handleFileSelect = (file: File) => {
    if (file.size === 0) {
      toast.error("Empty file", {
        description: "Please choose a non-empty image or PDF.",
      });
      return;
    }

    const preparedFile = prepareSelectedDocument(file);
    if (!preparedFile) {
      toast.error("Unsupported file type", {
        description: "Please choose a JPG, PNG, WEBP, or PDF document.",
      });
      return;
    }

    cancelInFlightRequest();
    setResult(null);
    setErrorMessage(null);
    setStatus("ready");
    setSelectedDocument(preparedFile);
  };

  const handleRemoveFile = () => {
    cancelInFlightRequest();
    setSelectedDocument(null);
    setResult(null);
    setErrorMessage(null);
    setStatus("idle");
  };

  const handleProcess = async () => {
    if (!selectedDocument) {
      toast.error("Select a document first", {
        description: "Choose a file so the demo has something to process.",
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
      formData.append("file", selectedDocument.file);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      const payload: unknown = await response.json().catch(() => null);
      const successResult = extractApiSuccessSchema.safeParse(payload);

      if (response.ok && successResult.success) {
        setResult(successResult.data.data);
        setStatus("complete");
        toast.success("Extraction complete", {
          description: "Structured fields and document text are now available.",
        });
        return;
      }

      const errorResult = extractApiErrorSchema.safeParse(payload);
      const message =
        errorResult.success
          ? errorResult.data.error.message
          : "The document could not be processed. Please try again.";

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

  const handleCopy = async () => {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formatExtractionSummary(result));
      toast.success("Results copied", {
        description: "A formatted extraction summary was copied to the clipboard.",
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
      description: "The live extraction response has been downloaded.",
    });
  };

  const handleDownloadExcel = async () => {
    if (!result) {
      return;
    }

    try {
      await downloadExtractionExcel(result);
      toast.success("Excel downloaded", {
        description: "Structured fields and notes have been exported to XLSX.",
      });
    } catch {
      toast.error("Excel export failed", {
        description: "The spreadsheet could not be generated in this browser.",
      });
    }
  };

  const handleClear = () => {
    handleRemoveFile();
    toast.message("Demo cleared", {
      description: "The selected file and results have been removed.",
    });
  };

  return (
    <PageShell>
      <HeroSection />

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-6 animate-fade-up">
          <UploadDropzone
            disabled={status === "processing"}
            file={selectedDocument}
            isDragActive={isDragActive}
            onDragActiveChange={setIsDragActive}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
          />
          <FilePreviewPanel file={selectedDocument} />
        </div>

        <div className="flex flex-col gap-6 animate-fade-up [animation-delay:120ms]">
          <ProcessActionBar
            errorMessage={errorMessage}
            hasFile={Boolean(selectedDocument)}
            onProcess={handleProcess}
            status={status}
          />
          <div ref={resultsRef}>
            <ResultTabs
              errorMessage={errorMessage}
              isProcessing={status === "processing"}
              onClear={handleClear}
              onCopy={handleCopy}
              onDownloadExcel={handleDownloadExcel}
              onDownloadJson={handleDownloadJson}
              result={result}
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function prepareSelectedDocument(file: File): SelectedDocument | null {
  const fallbackMimeType = resolveSupportedFileType(file.name, file.type);

  if (!fallbackMimeType) {
    return null;
  }

  if (fallbackMimeType === "application/pdf") {
    return {
      file,
      kind: "pdf",
    };
  }

  return {
    file,
    kind: "image",
    previewUrl: URL.createObjectURL(file),
  };
}
