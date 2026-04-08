"use client";

import { useState } from "react";
import { AlertCircle, Copy, Database, Expand, LoaderCircle, Sheet, Trash2 } from "lucide-react";
import { ExtractionResultsFocusDialog } from "@/components/document-extractor/extraction-results-focus-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotesPanel } from "@/components/document-extractor/notes-panel";
import { StructuredFieldsGrid } from "@/components/document-extractor/structured-fields-grid";
import { TextPanel } from "@/components/document-extractor/text-panel";
import type {
  ExtractionBatchResult,
  ProcessedFeedbackDocument,
} from "@/lib/types";

type ResultTabsProps = {
  errorMessage?: string | null;
  result: ExtractionBatchResult | null;
  isProcessing: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  onCopyDocument: (document: ProcessedFeedbackDocument) => void;
  onDownloadExcel: () => void;
  onSaveToDatabase: () => void;
  onClear: () => void;
};

export function ResultTabs({
  errorMessage,
  result,
  isProcessing,
  saveStatus,
  onCopyDocument,
  onDownloadExcel,
  onSaveToDatabase,
  onClear,
}: ResultTabsProps) {
  const [activeDocumentName, setActiveDocumentName] = useState<string>("");
  const [isFocusOpen, setIsFocusOpen] = useState(false);

  const activeDocument =
    result?.documents.find((document) => document.sourceFileName === activeDocumentName) ??
    result?.documents[0] ??
    null;

  if (isProcessing) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="gap-3">
          <CardTitle>Processing results</CardTitle>
          <CardDescription>
            Reviewing submitted forms and preparing structured records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-[24px]" />
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-[24px]" />
            ))}
          </div>
          <Skeleton className="h-10 w-72 rounded-full" />
          <Skeleton className="h-[560px] rounded-[28px]" />
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Processing results</CardTitle>
          <CardDescription>
            Results appear here after you process the selected forms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <div className="animate-fade-up flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-rose-100 bg-[linear-gradient(180deg,#fff7f7_0%,#fff_100%)] px-6 text-center">
              <div className="mb-5 flex size-18 items-center justify-center rounded-[24px] bg-rose-50 shadow-sm">
                <AlertCircle className="size-8 text-rose-600" />
              </div>
              <div className="max-w-md space-y-3">
                <Badge variant="destructive" className="mx-auto w-fit">
                  Processing error
                </Badge>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  The batch could not be processed
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {errorMessage}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid-glow flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border/80 bg-white/70 px-6 text-center">
              <div className="max-w-md space-y-3">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Ready to process forms
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Process the selected files to review captured responses and export
                  the latest results.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="max-w-xl space-y-2">
              <CardTitle>Processing results</CardTitle>
              <CardDescription>
                Review captured records, save them, or export the latest results.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 2xl:items-end">
              <Button
                aria-label="Open focus view"
                className="self-end"
                disabled={!activeDocument}
                onClick={() => setIsFocusOpen(true)}
                size="icon"
                variant="ghost"
              >
                <Expand className="size-4" />
              </Button>
              <div className="grid w-full gap-2 sm:grid-cols-2 2xl:w-auto 2xl:min-w-[28rem]">
                <Button
                  className="w-full justify-center"
                  disabled={!result || saveStatus === "saving" || saveStatus === "saved"}
                  onClick={onSaveToDatabase}
                  size="sm"
                  variant="outline"
                >
                  {saveStatus === "saving" ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : saveStatus === "saved" ? (
                    <>
                      <Database className="size-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Database className="size-4" />
                      Save records
                    </>
                  )}
                </Button>
                <Button
                  className="w-full justify-center"
                  disabled={!activeDocument}
                  onClick={() => activeDocument && onCopyDocument(activeDocument)}
                  size="sm"
                  variant="outline"
                >
                  <Copy className="size-4" />
                  Copy active record
                </Button>
                <Button className="w-full justify-center" onClick={onDownloadExcel} size="sm" variant="outline">
                  <Sheet className="size-4" />
                  Download Excel
                </Button>
                <Button className="w-full justify-center sm:col-span-2" onClick={onClear} size="sm" variant="ghost">
                  <Trash2 className="size-4" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
            <SummaryCard
              label="Processed"
              value={String(result.summary.totalFiles)}
              note={`${result.summary.totalPages} total pages`}
            />
            <SummaryCard
              label="Ready"
              value={String(result.summary.completedFiles)}
              note="Records available for export"
            />
            <SummaryCard
              label="Needs review"
              value={String(result.summary.failedFiles)}
              note="Forms that need a closer look"
            />
            <SummaryCard
              label="Saved"
              value={
                saveStatus === "saved"
                  ? "Saved"
                  : saveStatus === "saving"
                    ? "Saving"
                    : saveStatus === "error"
                      ? "Retry"
                      : "Pending"
              }
              note={
                saveStatus === "saved"
                  ? "Results stored successfully"
                  : saveStatus === "saving"
                    ? "Saving records"
                    : saveStatus === "error"
                      ? "Use save to try again"
                      : "Records are saved automatically"
              }
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Select a record</Badge>
              {activeDocument ? <Badge variant="outline">{activeDocument.sourceFileName}</Badge> : null}
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
              {result.documents.map((document) => {
                const isActive = document.sourceFileName === activeDocument?.sourceFileName;

                return (
                  <button
                    key={`${document.sourceFileName}-${document.pageCount}`}
                    className={`rounded-[24px] border p-4 text-left transition-all ${
                      isActive
                        ? "border-primary bg-primary/5 shadow-[0_10px_30px_rgba(24,87,255,0.08)]"
                        : "border-border/70 bg-white/80 hover:bg-white"
                    }`}
                    onClick={() => setActiveDocumentName(document.sourceFileName)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {document.sourceFileName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {document.pageCount} page{document.pageCount === 1 ? "" : "s"} •{" "}
                          {document.sourceKind.toUpperCase()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          document.status === "completed" ? "success" : "destructive"
                        }
                      >
                        {document.status === "completed" ? "Completed" : "Review"}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {activeDocument ? (
            <Tabs defaultValue="normalized">
              <TabsList>
                <TabsTrigger value="normalized">Structured Record</TabsTrigger>
                <TabsTrigger value="pages">Source Pages</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="normalized">
                <StructuredFieldsGrid document={activeDocument} />
              </TabsContent>

              <TabsContent value="pages">
                <div className="space-y-6">
                  <TextPanel
                    content={
                      activeDocument.combinedTranscription ||
                      "No combined transcription was returned."
                    }
                    description="Text captured from the submitted form for verification."
                    title="Captured text"
                  />

                  <div className="space-y-4">
                    {activeDocument.pageExtractions.map((page) => (
                      <Card
                        key={`${activeDocument.sourceFileName}-page-${page.pageNumber}`}
                        className="rounded-[28px] border-border/80 bg-white/90 shadow-sm"
                      >
                        <CardHeader className="gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">Page {page.pageNumber}</Badge>
                            {page.sectionTitle ? (
                              <Badge variant="outline">{page.sectionTitle}</Badge>
                            ) : null}
                            {page.missingOrUnclearFields.length > 0 ? (
                              <Badge variant="outline">
                                {page.missingOrUnclearFields.length} review flag
                                {page.missingOrUnclearFields.length === 1 ? "" : "s"}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="space-y-1">
                            <CardTitle>{page.pageSummary || `Page ${page.pageNumber}`}</CardTitle>
                            <CardDescription>
                              Details captured from this page for review.
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {page.extractedItems.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                              {page.extractedItems.map((item, index) => (
                                <div
                                  key={`${page.pageNumber}-${item.label}-${index}`}
                                  className="rounded-[24px] border border-border/70 bg-secondary/35 p-4"
                                >
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-semibold text-foreground">
                                        {item.label || "Unlabeled field"}
                                      </p>
                                      {item.isBlank ? (
                                        <Badge variant="outline">Blank on form</Badge>
                                      ) : null}
                                    </div>
                                    <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                                      {item.answer ||
                                        item.selectedOptions.join(", ") ||
                                        "No direct answer returned"}
                                    </p>
                                    {item.selectedOptions.length > 0 ? (
                                      <p className="text-xs text-muted-foreground">
                                        Selected: {item.selectedOptions.join(", ")}
                                      </p>
                                    ) : null}
                                    {item.evidence ? (
                                      <p className="text-xs text-muted-foreground">
                                        Observed on page: {item.evidence}
                                      </p>
                                    ) : null}
                                    {item.uncertainty ? (
                                      <p className="text-xs text-amber-700">
                                        Review note: {item.uncertainty}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-[24px] border border-border/70 bg-secondary/35 p-4 text-sm text-muted-foreground">
                              No answers were captured on this page.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes">
                <NotesPanel document={activeDocument} />
              </TabsContent>
            </Tabs>
          ) : null}
        </CardContent>
      </Card>

      <ExtractionResultsFocusDialog
        activeDocument={activeDocument}
        activeDocumentName={activeDocumentName}
        onClose={() => setIsFocusOpen(false)}
        onCopyDocument={onCopyDocument}
        onDownloadExcel={onDownloadExcel}
        onSelectDocument={setActiveDocumentName}
        open={isFocusOpen}
        result={result}
        saveStatus={saveStatus}
      />
    </>
  );
}

function SummaryCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card className="rounded-[24px] border-border/70 bg-white/90 shadow-sm">
      <CardContent className="flex min-h-[148px] flex-col space-y-2 p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {value}
        </p>
        <p className="text-sm leading-6 text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
