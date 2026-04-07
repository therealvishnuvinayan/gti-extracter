"use client";

import { useRef, type ChangeEvent, type DragEvent } from "react";
import { FileStack, RefreshCcw, Trash2, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SelectedDocument } from "@/components/document-extractor/document-extractor-demo";
import { ACCEPTED_SOURCE_FILE_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";

type UploadDropzoneProps = {
  files: SelectedDocument[];
  isDragActive: boolean;
  disabled?: boolean;
  onDragActiveChange: (active: boolean) => void;
  onFilesSelect: (files: File[]) => void;
  onClearFiles: () => void;
};

export function UploadDropzone({
  files,
  isDragActive,
  disabled,
  onDragActiveChange,
  onFilesSelect,
  onClearFiles,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    const nextFiles = Array.from(event.target.files ?? []);

    if (nextFiles.length === 0) {
      return;
    }

    onFilesSelect(nextFiles);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    onDragActiveChange(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragActiveChange(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragActiveChange(false);

    if (disabled) {
      return;
    }

    const nextFiles = Array.from(event.dataTransfer.files ?? []);

    if (nextFiles.length === 0) {
      return;
    }

    onFilesSelect(nextFiles);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3">
        <Badge variant="secondary" className="w-fit bg-white/80">
          Upload
        </Badge>
        <div className="space-y-1">
          <CardTitle>Drop in feedback forms</CardTitle>
          <CardDescription>
            Add one or more scanned PDFs. Images are supported for edge cases, but
            PDFs are the primary path.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          accept={ACCEPTED_SOURCE_FILE_TYPES}
          className="sr-only"
          disabled={disabled}
          multiple
          onChange={handleInputChange}
          type="file"
        />
        <div
          aria-disabled={disabled}
          className={cn(
            "group relative rounded-[28px] border border-dashed bg-gradient-to-br from-white to-accent/70 p-6 transition-all duration-200 sm:p-8",
            isDragActive && "border-primary bg-primary/5 shadow-[0_0_0_6px_rgba(24,87,255,0.08)]",
            disabled && "opacity-70",
          )}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border/70">
              <UploadCloud className="size-7 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                Drag and drop GTI forms here
              </p>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Best results come from high-resolution scans of the full feedback
                form, including faint ticks and handwritten comments.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button className="min-w-[148px]" disabled={disabled} onClick={openFilePicker}>
                Choose files
              </Button>
              <Badge variant="secondary">Accepted: JPG, PNG, WEBP, PDF</Badge>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-border/70 bg-white/80 p-4">
          {files.length > 0 ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                  <FileStack className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {files.length} file{files.length > 1 ? "s" : ""} ready for extraction
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(files.reduce((total, file) => total + file.file.size, 0))}
                    {" • "}
                    {files.filter((file) => file.kind === "pdf").length} PDF
                    {files.filter((file) => file.kind === "pdf").length !== 1 ? "s" : ""}
                    {" • "}
                    {files.filter((file) => file.kind === "image").length} image
                    {files.filter((file) => file.kind === "image").length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={disabled}
                  onClick={openFilePicker}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCcw className="size-4" />
                  Add more
                </Button>
                <Button
                  disabled={disabled}
                  onClick={onClearFiles}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 className="size-4" />
                  Clear all
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No feedback forms selected yet</p>
              <p>
                The selected file count, types, and total size will appear here
                before processing.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const size = bytes / 1024 ** unitIndex;

  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}
