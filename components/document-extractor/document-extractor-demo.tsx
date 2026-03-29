"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FilePreviewPanel } from "@/components/document-extractor/file-preview-panel";
import { HeroSection } from "@/components/document-extractor/hero-section";
import { MOCK_EXTRACTION_RESULT } from "@/components/document-extractor/mock-data";
import { PageShell } from "@/components/document-extractor/page-shell";
import { ProcessActionBar } from "@/components/document-extractor/process-action-bar";
import { ResultTabs } from "@/components/document-extractor/result-tabs";
import type {
  ExtractionResult,
  ProcessingStatus,
  SelectedDocument,
} from "@/components/document-extractor/types";
import { UploadDropzone } from "@/components/document-extractor/upload-dropzone";

const PROCESSING_DELAY_MS = 1800;

export function DocumentExtractorDemo() {
  const [selectedDocument, setSelectedDocument] = useState<SelectedDocument | null>(
    null,
  );
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [isDragActive, setIsDragActive] = useState(false);
  const processingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (selectedDocument?.previewUrl) {
        URL.revokeObjectURL(selectedDocument.previewUrl);
      }
    };
  }, [selectedDocument]);

  useEffect(() => {
    return () => {
      if (processingTimerRef.current) {
        window.clearTimeout(processingTimerRef.current);
      }
    };
  }, []);

  const resetProcessingTimer = () => {
    if (processingTimerRef.current) {
      window.clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
  };

  const handleFileSelect = (file: File) => {
    const preparedFile = prepareSelectedDocument(file);
    if (!preparedFile) {
      toast.error("Unsupported file type", {
        description: "Please choose a JPG, PNG, WEBP, or PDF document.",
      });
      return;
    }

    resetProcessingTimer();
    setResult(null);
    setStatus("ready");
    setSelectedDocument(preparedFile);
  };

  const handleRemoveFile = () => {
    resetProcessingTimer();
    setSelectedDocument(null);
    setResult(null);
    setStatus("idle");
  };

  const handleProcess = () => {
    if (!selectedDocument) {
      toast.error("Select a document first", {
        description: "Choose a file so the demo has something to process.",
      });
      return;
    }

    resetProcessingTimer();
    setResult(null);
    setStatus("processing");

    processingTimerRef.current = window.setTimeout(() => {
      setResult(MOCK_EXTRACTION_RESULT);
      setStatus("complete");
      toast.success("Mock extraction complete", {
        description: "Structured fields and text panels are now visible.",
      });
    }, PROCESSING_DELAY_MS);
  };

  const handleCopy = async () => {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      toast.success("Results copied", {
        description: "Mock extraction JSON copied to the clipboard.",
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

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mock-extraction-result.json";
    anchor.click();
    URL.revokeObjectURL(url);

    toast.success("JSON downloaded", {
      description: "A local mock result file has been generated.",
    });
  };

  const handleDownloadExcel = () => {
    toast.message("Excel export is not wired yet", {
      description: "Keep the control visible for the demo, then back it later.",
    });
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
            hasFile={Boolean(selectedDocument)}
            onProcess={handleProcess}
            status={status}
          />
          <ResultTabs
            isProcessing={status === "processing"}
            onClear={handleClear}
            onCopy={handleCopy}
            onDownloadExcel={handleDownloadExcel}
            onDownloadJson={handleDownloadJson}
            result={result}
          />
        </div>
      </section>
    </PageShell>
  );
}

function prepareSelectedDocument(file: File): SelectedDocument | null {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return {
      file,
      kind: "pdf",
    };
  }

  if (
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp"
  ) {
    return {
      file,
      kind: "image",
      previewUrl: URL.createObjectURL(file),
    };
  }

  return null;
}
