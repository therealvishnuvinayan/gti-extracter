import { CircleCheckBig, LoaderCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProcessingStatus } from "@/components/document-extractor/document-extractor-demo";

type ProcessActionBarProps = {
  hasFile: boolean;
  errorMessage?: string | null;
  status: ProcessingStatus;
  onProcess: () => void;
};

export function ProcessActionBar({
  errorMessage,
  hasFile,
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
            Server-side OpenAI
          </Badge>
        </div>
        <div className="space-y-1">
          <CardTitle>Process document</CardTitle>
          <CardDescription>
            Send the selected file to the extraction route and render validated
            structured results in the current UI.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-lg space-y-2 text-sm leading-6 text-muted-foreground">
          <p>
            The file remains selected locally so you can retry processing,
            replace it, or export the returned result.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2">
            {status === "complete" ? (
              <CircleCheckBig className="size-4 text-green-600" />
            ) : status === "error" ? (
              <Sparkles className="size-4 text-rose-600" />
            ) : (
              <Sparkles className="size-4 text-primary" />
            )}
            Refreshing the page clears the session.
          </div>
          {errorMessage ? (
            <p className="rounded-[18px] border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}
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
    case "error":
      return "Needs attention";
    default:
      return "Waiting for file";
  }
}
