import { CircleCheckBig, LoaderCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProcessingStatus } from "@/components/document-extractor/document-extractor-demo";

type ProcessActionBarProps = {
  documentCount: number;
  errorMessage?: string | null;
  status: ProcessingStatus;
  onProcess: () => void;
};

export function ProcessActionBar({
  documentCount,
  errorMessage,
  status,
  onProcess,
}: ProcessActionBarProps) {
  const isProcessing = status === "processing";
  const statusLabel = getStatusLabel(status);
  const statusVariant =
    status === "complete"
      ? "success"
      : status === "processing"
        ? "default"
        : status === "error"
          ? "destructive"
          : "secondary";

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <Badge variant="secondary" className="bg-white/80">
            GTI feedback form extraction
          </Badge>
        </div>
        <div className="space-y-1">
          <CardTitle>Process selected forms</CardTitle>
          <CardDescription>
            Create a persisted GTI extraction queue and process uploaded forms one
            file at a time for safer batch handling.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-lg space-y-2 text-sm leading-6 text-muted-foreground">
          <p>
            Files are queued, extracted sequentially, and saved to the database
            immediately after each successful form completes.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2">
            {status === "complete" ? (
              <CircleCheckBig className="size-4 text-green-600" />
            ) : status === "error" ? (
              <Sparkles className="size-4 text-rose-600" />
            ) : (
              <Sparkles className="size-4 text-primary" />
            )}
            Refreshing the page does not remove already-saved completed records.
          </div>
          {errorMessage ? (
            <p className="rounded-[18px] border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <Button
          className="min-w-[220px]"
          disabled={documentCount === 0 || isProcessing}
          onClick={onProcess}
          size="lg"
        >
          {isProcessing ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Process {documentCount || ""} form
              {documentCount === 1 ? "" : "s"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function getStatusLabel(status: ProcessingStatus) {
  switch (status) {
    case "ready":
      return "Ready";
    case "processing":
      return "Processing";
    case "complete":
      return "Results ready";
    case "error":
      return "Needs attention";
    default:
      return "Waiting for files";
  }
}
