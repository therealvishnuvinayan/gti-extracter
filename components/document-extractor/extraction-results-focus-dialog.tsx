"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Copy,
  Expand,
  FileSpreadsheet,
  Sheet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { compactLongTextFieldKeys, feedbackFieldGroups } from "@/lib/feedback-field-groups";
import {
  getNormalizedFeedbackFieldValue,
  normalizedFeedbackFieldLabels,
  type ExtractionBatchResult,
  type ProcessedFeedbackDocument,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type ExtractionResultsFocusDialogProps = {
  open: boolean;
  result: ExtractionBatchResult | null;
  activeDocument: ProcessedFeedbackDocument | null;
  activeDocumentName: string;
  saveStatus: "idle" | "saving" | "saved" | "error";
  onClose: () => void;
  onCopyDocument: (document: ProcessedFeedbackDocument) => void;
  onDownloadExcel: () => void;
  onSelectDocument: (documentName: string) => void;
};

export function ExtractionResultsFocusDialog({
  open,
  result,
  activeDocument,
  activeDocumentName,
  saveStatus,
  onClose,
  onCopyDocument,
  onDownloadExcel,
  onSelectDocument,
}: ExtractionResultsFocusDialogProps) {
  const selectedDocumentName = activeDocumentName || activeDocument?.sourceFileName || "";

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || !result || !activeDocument || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
    >
      <Tabs
        className="absolute inset-3 flex flex-col overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fe_100%)] shadow-[0_28px_90px_rgba(15,23,42,0.22)] sm:inset-5 lg:inset-7"
        defaultValue="overview"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-border/70 bg-white/92 backdrop-blur-xl">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-white">
                    <Expand className="size-3.5" />
                    Focus view
                  </Badge>
                  <Badge
                    variant={activeDocument.status === "completed" ? "success" : "destructive"}
                  >
                    {activeDocument.status === "completed" ? "Completed" : "Needs review"}
                  </Badge>
                  <Badge variant="outline">
                    {activeDocument.pageCount} page{activeDocument.pageCount === 1 ? "" : "s"}
                  </Badge>
                  {activeDocument.normalized.missingOrUnclearFields.length > 0 ? (
                    <Badge variant="outline">
                      {activeDocument.normalized.missingOrUnclearFields.length} flagged
                    </Badge>
                  ) : null}
                  {activeDocument.normalized.confidenceNotes.length > 0 ? (
                    <Badge variant="outline">
                      {activeDocument.normalized.confidenceNotes.length} note
                      {activeDocument.normalized.confidenceNotes.length === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                  <Badge
                    variant={
                      saveStatus === "saved"
                        ? "success"
                        : saveStatus === "error"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {saveStatus === "saved"
                      ? "Saved"
                      : saveStatus === "saving"
                        ? "Saving"
                        : saveStatus === "error"
                          ? "Retry save"
                          : "Not saved"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
                    {activeDocument.sourceFileName}
                  </h2>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    A compact, presentation-friendly view for reviewing the captured
                    output and sharing a clean screenshot.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <Button onClick={() => onCopyDocument(activeDocument)} size="sm" variant="outline">
                  <Copy className="size-4" />
                  Copy summary
                </Button>
                <Button onClick={onDownloadExcel} size="sm" variant="outline">
                  <Sheet className="size-4" />
                  Download Excel
                </Button>
                <Button onClick={onClose} size="sm" variant="outline">
                  Exit fullscreen
                </Button>
                <Button aria-label="Close focus view" onClick={onClose} size="icon" variant="ghost">
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {result.documents.length > 1 ? (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {result.documents.map((documentOption) => {
                  const isActive = documentOption.sourceFileName === selectedDocumentName;

                  return (
                    <button
                      key={`${documentOption.sourceFileName}-${documentOption.pageCount}`}
                      className={cn(
                        "rounded-[20px] border px-4 py-3 text-left transition-all",
                        isActive
                          ? "border-primary bg-primary/6 shadow-[0_10px_30px_rgba(24,87,255,0.10)]"
                          : "border-border/70 bg-white hover:bg-secondary/20",
                      )}
                      onClick={() => onSelectDocument(documentOption.sourceFileName)}
                      type="button"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {documentOption.sourceFileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {documentOption.pageCount} page
                            {documentOption.pageCount === 1 ? "" : "s"} •{" "}
                            {documentOption.sourceKind.toUpperCase()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            documentOption.status === "completed"
                              ? "success"
                              : "destructive"
                          }
                        >
                          {documentOption.status === "completed" ? "Ready" : "Review"}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <TabsList className="w-full justify-start overflow-x-auto rounded-full bg-secondary/65 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pages">Source Pages</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <TabsContent className="mt-0" value="overview">
            <CompactOverview document={activeDocument} />
          </TabsContent>

          <TabsContent className="mt-0" value="pages">
            <CompactSourcePages document={activeDocument} />
          </TabsContent>

          <TabsContent className="mt-0" value="notes">
            <CompactNotes document={activeDocument} />
          </TabsContent>
        </div>
      </Tabs>
    </div>,
    document.body,
  );
}

function CompactOverview({ document }: { document: ProcessedFeedbackDocument }) {
  return (
    <div className="space-y-4">
      {document.errorMessage ? (
        <div className="rounded-[24px] border border-rose-100 bg-[linear-gradient(180deg,#fff7f7_0%,#fff_100%)] p-4 text-sm leading-6 text-rose-700">
          {document.errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {feedbackFieldGroups.map((group) => (
          <section
            key={group.id}
            className={cn(
              "rounded-[26px] border border-border/75 bg-white/90 p-4 shadow-sm sm:p-5",
              group.id === "ratings" || group.id === "comments" ? "xl:col-span-2" : "",
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
            </div>

            <div
              className={cn(
                "grid gap-3 sm:grid-cols-2",
                group.id === "ratings"
                  ? "2xl:grid-cols-4"
                  : group.id === "comments"
                    ? "xl:grid-cols-2"
                    : "2xl:grid-cols-3",
              )}
            >
              {group.fields.map((field) => {
                if (field === "sourceFileName") {
                  return null;
                }

                const value =
                  getNormalizedFeedbackFieldValue(document.normalized, field) ||
                  "Not provided";
                const isLongText =
                  compactLongTextFieldKeys.has(field) ||
                  value.length > 120 ||
                  value.includes("\n");

                return (
                  <article
                    key={field}
                    className={cn(
                      "rounded-[20px] border border-border/70 bg-secondary/25 p-3.5",
                      isLongText ? "sm:col-span-2" : "",
                      group.id === "comments" ? "xl:col-span-1" : "",
                    )}
                  >
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {normalizedFeedbackFieldLabels[field]}
                    </p>
                    <p
                      className={cn(
                        "whitespace-pre-line text-sm font-semibold leading-6 text-foreground",
                        isLongText ? "min-h-[6rem]" : "min-h-[2.5rem]",
                      )}
                    >
                      {value}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <section className="rounded-[26px] border border-border/75 bg-white/90 p-4 shadow-sm sm:p-5 xl:col-span-2">
          <div className="mb-4 space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Notes and review items</h3>
            <p className="text-sm text-muted-foreground">
              Compact flags and comments for quick review in meetings and screenshots.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <CompactListCard
              emptyMessage="No confidence notes were added for this record."
              icon="note"
              items={document.normalized.confidenceNotes}
              title="Confidence notes"
            />
            <CompactListCard
              emptyMessage="No missing or unclear fields were flagged."
              icon="alert"
              items={document.normalized.missingOrUnclearFields}
              title="Missing or unclear fields"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function CompactSourcePages({ document }: { document: ProcessedFeedbackDocument }) {
  return (
    <div className="space-y-4">
      <section className="rounded-[26px] border border-border/75 bg-white/90 p-4 shadow-sm sm:p-5">
        <div className="mb-3 space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Captured text</h3>
          <p className="text-sm text-muted-foreground">
            Consolidated text captured from the submitted document.
          </p>
        </div>
        <div className="rounded-[22px] border border-border/70 bg-secondary/25 p-4">
          <p className="whitespace-pre-line text-sm leading-6 text-foreground">
            {document.combinedTranscription || "No captured text was returned."}
          </p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {document.pageExtractions.length > 0 ? document.pageExtractions.map((page) => (
          <section
            key={`${document.sourceFileName}-focus-page-${page.pageNumber}`}
            className="rounded-[26px] border border-border/75 bg-white/90 p-4 shadow-sm"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Page {page.pageNumber}</Badge>
              {page.sectionTitle ? <Badge variant="outline">{page.sectionTitle}</Badge> : null}
              {page.missingOrUnclearFields.length > 0 ? (
                <Badge variant="outline">{page.missingOrUnclearFields.length} flagged</Badge>
              ) : null}
            </div>

            <div className="mb-4 space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {page.pageSummary || `Page ${page.pageNumber}`}
              </h3>
              <p className="text-sm text-muted-foreground">
                Review the answers captured from this page.
              </p>
            </div>

            <div className="space-y-3">
              {page.extractedItems.length > 0 ? (
                page.extractedItems.map((item, index) => (
                  <div
                    key={`${page.pageNumber}-${item.label}-${index}`}
                    className="rounded-[20px] border border-border/70 bg-secondary/25 p-3.5"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {item.label || "Unlabeled field"}
                      </p>
                      {item.isBlank ? <Badge variant="outline">Blank</Badge> : null}
                    </div>
                    <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                      {item.answer || item.selectedOptions.join(", ") || "No direct answer returned"}
                    </p>
                    {item.evidence ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Observed on page: {item.evidence}
                      </p>
                    ) : null}
                    {item.uncertainty ? (
                      <p className="mt-1 text-xs text-amber-700">
                        Review note: {item.uncertainty}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-border/70 bg-secondary/25 p-3.5 text-sm text-muted-foreground">
                  No answers were captured on this page.
                </div>
              )}
            </div>
          </section>
        )) : (
          <section className="rounded-[26px] border border-border/75 bg-white/90 p-4 text-sm leading-6 text-muted-foreground shadow-sm xl:col-span-2 2xl:col-span-3">
            No page-level details were captured for this file.
          </section>
        )}
      </div>
    </div>
  );
}

function CompactNotes({ document }: { document: ProcessedFeedbackDocument }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[26px] border border-border/75 bg-white/90 p-4 shadow-sm sm:p-5">
        <div className="mb-4 space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Review notes</h3>
          <p className="text-sm text-muted-foreground">
            Confidence notes and flagged items collected during processing.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <CompactListCard
            emptyMessage="No confidence notes were added for this record."
            icon="note"
            items={document.normalized.confidenceNotes}
            title="Confidence notes"
          />
          <CompactListCard
            emptyMessage="No missing or unclear fields were flagged."
            icon="alert"
            items={document.normalized.missingOrUnclearFields}
            title="Missing or unclear fields"
          />
        </div>
      </section>

      <section className="rounded-[26px] border border-border/75 bg-white/90 p-4 shadow-sm sm:p-5">
        <div className="mb-4 space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Status summary</h3>
          <p className="text-sm text-muted-foreground">
            Quick snapshot for presentation and review.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <CompactMetricCard label="Status" value={document.status === "completed" ? "Completed" : "Needs review"} />
          <CompactMetricCard label="Pages" value={String(document.pageCount)} />
          <CompactMetricCard label="Confidence notes" value={String(document.normalized.confidenceNotes.length)} />
          <CompactMetricCard label="Flagged fields" value={String(document.normalized.missingOrUnclearFields.length)} />
        </div>
        {document.errorMessage ? (
          <div className="mt-4 rounded-[20px] border border-rose-100 bg-rose-50/80 p-4 text-sm leading-6 text-rose-700">
            {document.errorMessage}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function CompactListCard({
  title,
  items,
  emptyMessage,
  icon,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
  icon: "alert" | "note";
}) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-secondary/20 p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div
              key={`${title}-${index}-${item}`}
              className="inline-flex items-start gap-2 rounded-full border border-border/70 bg-white px-3 py-2 text-xs leading-5 text-foreground"
            >
              {icon === "alert" ? (
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
              ) : (
                <FileSpreadsheet className="mt-0.5 size-3.5 shrink-0 text-primary" />
              )}
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

function CompactMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-border/70 bg-secondary/20 p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
