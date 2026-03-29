import { CircleCheckBig, LoaderCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProcessingStatus } from "@/components/document-extractor/types";

type ProcessActionBarProps = {
  hasFile: boolean;
  status: ProcessingStatus;
  onProcess: () => void;
};

export function ProcessActionBar({
  hasFile,
  status,
  onProcess,
}: ProcessActionBarProps) {
  const isProcessing = status === "processing";
  const statusLabel = getStatusLabel(status);
  const statusVariant =
    status === "complete" ? "success" : status === "processing" ? "default" : "secondary";

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <Badge variant="secondary" className="bg-white/80">
            Local state only
          </Badge>
        </div>
        <div className="space-y-1">
          <CardTitle>Process document</CardTitle>
          <CardDescription>
            No API call happens here. This simulates a polished extraction cycle
            in roughly two seconds.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-lg space-y-2 text-sm leading-6 text-muted-foreground">
          <p>
            Use this to demo the end-to-end product story before wiring in real
            extraction logic.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2">
            {status === "complete" ? (
              <CircleCheckBig className="size-4 text-green-600" />
            ) : (
              <Sparkles className="size-4 text-primary" />
            )}
            Refreshing the page clears the session.
          </div>
        </div>
        <Button
          className="min-w-[184px]"
          disabled={!hasFile || isProcessing}
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
              Process document
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
      return "Results loaded";
    default:
      return "Waiting for file";
  }
}
