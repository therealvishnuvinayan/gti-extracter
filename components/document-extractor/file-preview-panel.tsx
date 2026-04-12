import Image from "next/image";
import { Eye, FileImage, FileText, ScanSearch, Trash2 } from "lucide-react";
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
import type { ExtractionBatchResult } from "@/lib/types";

type FilePreviewPanelProps = {
  files: SelectedDocument[];
  result: ExtractionBatchResult | null;
  disabled?: boolean;
  onRemoveFile: (id: string) => void;
};

export function FilePreviewPanel({
  files,
  result,
  disabled,
  onRemoveFile,
}: FilePreviewPanelProps) {
  const singleImagePreview =
    files.length === 1 && files[0]?.kind === "image" ? files[0] : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3">
        <Badge variant="secondary" className="w-fit bg-white/80">
          Selected Files
        </Badge>
        <div className="space-y-1">
          <CardTitle>Selected forms</CardTitle>
          <CardDescription>
            Review the GTI feedback forms before processing.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {singleImagePreview?.previewUrl ? (
          <div className="animate-fade-up overflow-hidden rounded-[28px] border border-border/70 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border/70 bg-white/90 px-4 py-3 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <Eye className="size-4 text-primary" />
                Image preview
              </div>
              <Badge variant="secondary">{singleImagePreview.file.type || "image/*"}</Badge>
            </div>
            <div className="relative aspect-[4/3] bg-muted/40">
              <Image
                alt={singleImagePreview.file.name}
                className="object-contain"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                src={singleImagePreview.previewUrl}
              />
            </div>
          </div>
        ) : null}

        {files.length > 0 ? (
          <div className="space-y-3">
            {files.map((file) => {
              const documentResult = result?.documents.find(
                (document) => document.sourceFileName === file.file.name,
              );

              return (
                <div
                  key={file.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-border/70 bg-white/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary">
                      {file.kind === "pdf" ? (
                        <FileText className="size-5 text-primary" />
                      ) : (
                        <FileImage className="size-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {file.file.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file.size)}</span>
                        <span>•</span>
                        <span>{file.kind.toUpperCase()}</span>
                        {documentResult ? (
                          <>
                            <span>•</span>
                            <Badge
                              variant={
                                documentResult.status === "completed"
                                  ? "success"
                                  : "destructive"
                              }
                            >
                              {documentResult.status === "completed"
                                ? "Extracted"
                                : "Needs review"}
                            </Badge>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {documentResult ? (
                      <Badge variant="secondary">
                        {documentResult.pageCount} page
                        {documentResult.pageCount !== 1 ? "s" : ""}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Queued</Badge>
                    )}
                    <Button
                      disabled={disabled}
                      onClick={() => onRemoveFile(file.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid-glow flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border/80 bg-white/70 px-6 text-center">
            <div className="mb-5 flex size-18 items-center justify-center rounded-[24px] bg-secondary shadow-sm">
              <ScanSearch className="size-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              No files added yet
            </h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Add one or more GTI feedback forms to review them here before processing.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/90 px-4 py-2 text-sm text-muted-foreground">
              <FileText className="size-4 text-primary" />
              Best with scanned, multi-page GTI feedback forms
            </div>
          </div>
        )}
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
