"use client";

import {
  Ban,
  Database,
  Download,
  LoaderCircle,
  Play,
  RefreshCcw,
} from "lucide-react";
import { BatchItemsTable } from "@/components/document-extractor/batch-items-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  PersistedExtractionBatch,
  PersistedExtractionBatchItem,
} from "@/lib/types";

type BatchProgressCardProps = {
  batch: PersistedExtractionBatch | null;
  items: PersistedExtractionBatchItem[];
  isWorking: boolean;
  onRefresh: () => void;
  onResume: () => void;
  onCancel: () => void;
  onDownloadExcel: () => void;
};

export function BatchProgressCard({
  batch,
  items,
  isWorking,
  onRefresh,
  onResume,
  onCancel,
  onDownloadExcel,
}: BatchProgressCardProps) {
  if (!batch) {
    return (
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Batch queue</Badge>
            <Badge variant="outline">Idle</Badge>
          </div>
          <CardTitle>Large batch processing</CardTitle>
          <CardDescription>
            Create a persisted queue, process files one by one, and keep completed
            records saved immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid-glow flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border/80 bg-white/70 px-6 text-center">
            <div className="max-w-md space-y-3">
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                No active batch yet
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Add GTI forms on the left, then start the queue to process them one
                by one.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = Math.round(batch.completionRatio * 100);
  const canResume =
    batch.status === "queued" ||
    batch.status === "cancelled" ||
    batch.status === "partial" ||
    batch.status === "failed";
  const canCancel = batch.status === "processing" || batch.queuedFiles > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Batch queue</Badge>
              <Badge variant={resolveBatchVariant(batch.status)}>
                {formatBatchStatus(batch.status)}
              </Badge>
              <Badge variant="outline">{batch.totalFiles} files</Badge>
            </div>
            <div>
              <CardTitle>Persisted extraction batch</CardTitle>
              <CardDescription>
                Each completed file is saved to the database immediately, so refresh
                or cancel does not lose finished work.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isWorking}
              onClick={onRefresh}
              size="sm"
              variant="outline"
            >
              <RefreshCcw className="size-4" />
              Refresh
            </Button>
            <Button
              disabled={!canResume || isWorking}
              onClick={onResume}
              size="sm"
              variant="outline"
            >
              {isWorking ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {batch.status === "queued" ? "Start queue" : "Resume queue"}
            </Button>
            <Button
              disabled={!canCancel}
              onClick={onCancel}
              size="sm"
              variant="outline"
            >
              <Ban className="size-4" />
              Cancel
            </Button>
            <Button
              disabled={batch.successFiles === 0}
              onClick={onDownloadExcel}
              size="sm"
              variant="outline"
            >
              <Download className="size-4" />
              Export batch
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <Database className="size-4 text-primary" />
              <span>Batch ID</span>
              <span className="rounded-full border border-border/70 bg-white/80 px-3 py-1 font-mono text-xs text-foreground">
                {batch.id}
              </span>
            </div>
            <span className="font-medium text-foreground">{progressPercentage}% complete</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-secondary/60">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="rounded-[20px] border border-border/70 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
            {batch.currentFileName
              ? `Currently processing: ${batch.currentFileName}`
              : batch.status === "completed"
                ? "All files finished successfully."
                : batch.status === "partial"
                  ? "Batch finished with a mix of completed and failed/cancelled files."
                  : batch.status === "cancelled"
                    ? "Batch stopped. Completed records remain saved."
                    : "Queue is ready to continue."}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
          <SummaryCard label="Queued" value={String(batch.queuedFiles)} />
          <SummaryCard label="Processing" value={String(batch.processingFiles)} />
          <SummaryCard label="Completed" value={String(batch.completedFiles)} />
          <SummaryCard label="Failed" value={String(batch.failedFiles)} />
          <SummaryCard label="Cancelled" value={String(batch.cancelledFiles)} />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Queue items</Badge>
            <Badge variant="outline">{items.length} total</Badge>
          </div>
          <BatchItemsTable items={items} />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-white/90 p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function resolveBatchVariant(status: PersistedExtractionBatch["status"]) {
  if (status === "completed") {
    return "success";
  }

  if (status === "processing") {
    return "default";
  }

  if (status === "queued") {
    return "secondary";
  }

  if (status === "partial" || status === "failed") {
    return "destructive";
  }

  return "outline";
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
