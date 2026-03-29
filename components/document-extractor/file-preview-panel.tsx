import Image from "next/image";
import { Eye, FileImage, FileText, ScanSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SelectedDocument } from "@/components/document-extractor/document-extractor-demo";

type FilePreviewPanelProps = {
  file: SelectedDocument | null;
};

export function FilePreviewPanel({ file }: FilePreviewPanelProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3">
        <Badge variant="secondary" className="w-fit bg-white/80">
          Preview
        </Badge>
        <div className="space-y-1">
          <CardTitle>Document preview</CardTitle>
          <CardDescription>
            Inspect the selected file before sending it for extraction.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {file ? (
          file.kind === "image" && file.previewUrl ? (
            <div className="animate-fade-up overflow-hidden rounded-[28px] border border-border/70 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border/70 bg-white/90 px-4 py-3 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-2">
                  <Eye className="size-4 text-primary" />
                  Local image preview
                </div>
                <Badge variant="secondary">{file.file.type || "image/*"}</Badge>
              </div>
              <div className="relative aspect-[4/3] bg-muted/40">
                <Image
                  alt={file.file.name}
                  className="object-contain"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  src={file.previewUrl}
                />
              </div>
            </div>
          ) : (
            <div className="animate-fade-up flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fd_100%)] px-6 text-center">
              <div className="mb-5 flex size-18 items-center justify-center rounded-[24px] bg-secondary shadow-sm">
                <FileText className="size-9 text-primary" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                PDF preview ready
              </h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                The preview stays lightweight, but the backend can still process
                the uploaded PDF during extraction.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="outline">{file.file.name}</Badge>
                <Badge variant="secondary">PDF</Badge>
              </div>
            </div>
          )
        ) : (
          <div className="grid-glow flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border/80 bg-white/70 px-6 text-center">
            <div className="mb-5 flex size-18 items-center justify-center rounded-[24px] bg-secondary shadow-sm">
              <ScanSearch className="size-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              Nothing to preview yet
            </h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Upload a handwritten image or PDF to see a local preview and then
              populate the extraction panels with live results.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/90 px-4 py-2 text-sm text-muted-foreground">
              <FileImage className="size-4 text-primary" />
              Ideal for scanned forms and phone photos
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
