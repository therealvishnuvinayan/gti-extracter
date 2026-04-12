"use client";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  LoaderCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PersistedExtractionBatchItem } from "@/lib/types";

type BatchItemsTableProps = {
  items: PersistedExtractionBatchItem[];
};

export function BatchItemsTable({ items }: BatchItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-border/70 bg-white/70 px-4 py-8 text-center text-sm text-muted-foreground">
        Batch items will appear here after the queue is created.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-border/70 bg-white/85">
      <div className="max-h-[360px] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-secondary/55 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Finished</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-t border-border/70 align-top transition-colors hover:bg-secondary/15"
              >
                <td className="px-4 py-3 text-muted-foreground">
                  {item.queueOrder + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className="max-w-[22rem] truncate font-medium text-foreground">
                      {item.fileName}
                    </p>
                    {item.errorMessage ? (
                      <p className="max-w-[28rem] text-xs leading-5 text-rose-700">
                        {item.errorMessage}
                      </p>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.finishedAt ? formatDisplayDate(item.finishedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: PersistedExtractionBatchItem["status"];
}) {
  if (status === "completed") {
    return (
      <Badge variant="success">
        <CheckCircle2 className="size-3.5" />
        Completed
      </Badge>
    );
  }

  if (status === "processing") {
    return (
      <Badge variant="default">
        <LoaderCircle className="size-3.5 animate-spin" />
        Processing
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge variant="destructive">
        <AlertCircle className="size-3.5" />
        Failed
      </Badge>
    );
  }

  if (status === "cancelled") {
    return (
      <Badge variant="outline">
        <Ban className="size-3.5" />
        Cancelled
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Clock3 className="size-3.5" />
      Queued
    </Badge>
  );
}

function formatDisplayDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
