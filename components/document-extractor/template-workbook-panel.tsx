"use client";

import { useRef, type ChangeEvent } from "react";
import { FileSpreadsheet, RefreshCcw, Trash2, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ACCEPTED_TEMPLATE_FILE_TYPES } from "@/lib/types";

type TemplateWorkbookPanelProps = {
  file: File | null;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

export function TemplateWorkbookPanel({
  file,
  disabled,
  onSelect,
  onRemove,
}: TemplateWorkbookPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    onSelect(nextFile);
    event.target.value = "";
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3">
        <Badge variant="secondary" className="w-fit bg-white/80">
          Template
        </Badge>
        <div className="space-y-1">
          <CardTitle>GTI workbook template</CardTitle>
          <CardDescription>
            Upload `database.xlsx` to preserve the exact GTI column names and order.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          accept={ACCEPTED_TEMPLATE_FILE_TYPES}
          className="sr-only"
          disabled={disabled}
          onChange={handleChange}
          type="file"
        />

        <div className="rounded-[24px] border border-border/70 bg-white/80 p-4">
          {file ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
                  <FileSpreadsheet className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)} • Excel template ready
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
                  Replace
                </Button>
                <Button
                  disabled={disabled}
                  onClick={onRemove}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-[20px] border border-dashed border-border/70 bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fd_100%)] p-5">
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary">
                <UploadCloud className="size-5 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  No template workbook selected
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Extraction still works without it, but uploading the GTI workbook is
                  the only way to guarantee the exported Excel matches the demo
                  template structure exactly.
                </p>
              </div>
              <div>
                <Button disabled={disabled} onClick={openFilePicker} variant="outline">
                  <FileSpreadsheet className="size-4" />
                  Upload `database.xlsx`
                </Button>
              </div>
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
