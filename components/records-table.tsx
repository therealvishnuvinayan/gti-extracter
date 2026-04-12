"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Database,
  Download,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  basicApiErrorSchema,
  deleteRecordApiSuccessSchema,
  paginatedRecordsApiSuccessSchema,
  type FeedbackRecord,
} from "@/lib/types";

type RecordsTableProps = {
  isActive: boolean;
  refreshToken: number;
};

type LoadStatus = "idle" | "loading" | "ready" | "error";

export function RecordsTable({ isActive, refreshToken }: RecordsTableProps) {
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const requestAbortRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);

  const loadRecords = useCallback(async (targetPage = page) => {
    if (requestAbortRef.current) {
      requestAbortRef.current.abort();
    }

    const abortController = new AbortController();
    requestAbortRef.current = abortController;
    setStatus(hasLoadedRef.current ? "ready" : "loading");
    setErrorMessage(null);

    try {
      const { response, payload } = await fetchRecords({
        page: targetPage,
        pageSize,
        signal: abortController.signal,
      });
      const parsedSuccess = paginatedRecordsApiSuccessSchema.safeParse(payload);

      if (response.ok && parsedSuccess.success) {
        setRecords(parsedSuccess.data.items);
        setPage(parsedSuccess.data.page);
        setTotalItems(parsedSuccess.data.totalItems);
        setTotalPages(parsedSuccess.data.totalPages);
        setStatus("ready");
        hasLoadedRef.current = true;
        return true;
      }

      const parsedError = basicApiErrorSchema.safeParse(payload);
      const message =
        parsedError.success
          ? parsedError.data.error.message
          : "The saved records could not be loaded.";

      setStatus("error");
      setErrorMessage(message);
      return false;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return false;
      }

      setStatus("error");
      setErrorMessage("The records request did not complete successfully.");
      return false;
    } finally {
      requestAbortRef.current = null;
    }
  }, [page, pageSize]);

  useEffect(() => {
    return () => {
      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    void loadRecords(page);
  }, [isActive, refreshToken, loadRecords, page]);

  const handleRefresh = async () => {
    const didRefresh = await loadRecords(page);
    if (didRefresh) {
      toast.success("Records refreshed", {
        description: "Latest saved feedback rows have been loaded.",
      });
    }
  };

  const handleDownloadExcel = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch("/api/export", {
        method: "GET",
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const parsedError = basicApiErrorSchema.safeParse(payload);

        throw new Error(
          parsedError.success
            ? parsedError.data.error.message
            : "The export could not be generated.",
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "gti-feedback-records.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);

      toast.success("Excel downloaded", {
        description: "All saved records were exported successfully.",
      });
    } catch (error) {
      toast.error("Export failed", {
        description:
          error instanceof Error
            ? error.message
            : "The export could not be generated.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteRecord = async (record: FeedbackRecord) => {
    const confirmed = window.confirm(
      `Delete the saved record for "${record.sourceFileName ?? record.cityAreaName ?? "this form"}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingRecordId(record.id);

    try {
      const response = await fetch("/api/records", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: record.id }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const parsedSuccess = deleteRecordApiSuccessSchema.safeParse(payload);

      if (response.ok && parsedSuccess.success) {
        setExpandedRecordId((current) =>
          current === parsedSuccess.data.id ? null : current,
        );
        const nextTotalItems = Math.max(totalItems - 1, 0);
        const nextTotalPages =
          nextTotalItems === 0 ? 0 : Math.ceil(nextTotalItems / pageSize);
        const nextPage =
          page > 1 && records.length === 1 ? Math.max(page - 1, 1) : page;
        setTotalItems(nextTotalItems);
        setTotalPages(nextTotalPages);
        setPage(nextPage);
        await loadRecords(nextPage);
        toast.success("Record deleted", {
          description: "The selected record was removed.",
        });
        return;
      }

      const parsedError = basicApiErrorSchema.safeParse(payload);
      throw new Error(
        parsedError.success
          ? parsedError.data.error.message
          : "The record could not be deleted.",
      );
    } catch (error) {
      toast.error("Delete failed", {
        description:
          error instanceof Error ? error.message : "The record could not be deleted.",
      });
    } finally {
      setDeletingRecordId(null);
    }
  };

  return (
    <Card className="overflow-hidden animate-fade-up">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <Database className="size-3.5" />
                Records
              </Badge>
              <Badge variant={totalItems > 0 ? "success" : "outline"}>
                {totalItems} saved row{totalItems === 1 ? "" : "s"}
              </Badge>
              <Badge variant="outline">
                Page {totalPages === 0 ? 0 : page} of {totalPages}
              </Badge>
            </div>
            <CardTitle>Saved feedback records</CardTitle>
            <CardDescription>
              Review saved feedback records, inspect full details, and export the
              latest data to Excel.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={status === "loading"} onClick={handleRefresh} size="sm" variant="outline">
              <RefreshCcw className={`size-4 ${status === "loading" ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button disabled={isDownloading} onClick={handleDownloadExcel} size="sm" variant="outline">
              <Download className="size-4" />
              Download Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "loading" && records.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-[18px]" />
            ))}
          </div>
        ) : errorMessage && records.length === 0 ? (
          <div className="rounded-[24px] border border-rose-100 bg-rose-50/80 p-5 text-sm leading-6 text-rose-700">
            {errorMessage}
          </div>
        ) : records.length === 0 ? (
          <div className="grid-glow flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border/80 bg-white/70 px-6 text-center">
            <div className="max-w-md space-y-3">
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                No saved records yet
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Extract GTI feedback forms first. Saved records will appear here
                automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {errorMessage ? (
              <div className="rounded-[20px] border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
                {errorMessage}
              </div>
            ) : null}
            <div className="overflow-hidden rounded-[24px] border border-border/70 bg-white/85">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-secondary/55 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">City</th>
                      <th className="px-4 py-3 font-medium">SKU</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Rating</th>
                      <th className="px-4 py-3 font-medium">Brand</th>
                      <th className="px-4 py-3 font-medium">Created At</th>
                      <th className="px-4 py-3 font-medium text-right">Details</th>
                      <th className="px-4 py-3 font-medium text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const isExpanded = expandedRecordId === record.id;

                      return (
                        <Fragment key={record.id}>
                          <tr className="border-t border-border/70 align-top transition-colors hover:bg-secondary/25">
                            <td className="px-4 py-3 text-foreground">
                              {record.cityAreaName || "—"}
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {record.milanoSkuTested || "—"}
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {record.cigaretteFilterType || record.respondentType || "—"}
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {record.overallSatisfactionRating || "—"}
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {record.brandSmokedMostOften || "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDisplayDate(record.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                disabled={deletingRecordId === record.id}
                                onClick={() =>
                                  setExpandedRecordId(isExpanded ? null : record.id)
                                }
                                size="sm"
                                variant="ghost"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="size-4" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="size-4" />
                                    View
                                  </>
                                )}
                              </Button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                aria-label={`Delete ${record.sourceFileName ?? "record"}`}
                                className="text-rose-600 hover:text-rose-700"
                                disabled={deletingRecordId === record.id}
                                onClick={() => void handleDeleteRecord(record)}
                                size="sm"
                                title="Delete record"
                                variant="ghost"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="border-t border-border/70 bg-secondary/18">
                              <td className="px-4 py-4" colSpan={8}>
                                <ExpandedRecordDetails record={record} />
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {records.length > 0 || totalItems > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-border/70 bg-secondary/20 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  Showing {records.length} row{records.length === 1 ? "" : "s"} on
                  this page.
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={page <= 1 || status === "loading"}
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    disabled={totalPages === 0 || page >= totalPages || status === "loading"}
                    onClick={() =>
                      setPage((current) =>
                        totalPages === 0 ? current : Math.min(current + 1, totalPages),
                      )
                    }
                    size="sm"
                    variant="outline"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function fetchRecords({
  page,
  pageSize,
  signal,
}: {
  page: number;
  pageSize: number;
  signal?: AbortSignal;
}) {
  const response = await fetch(`/api/records?page=${page}&pageSize=${pageSize}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  return {
    response,
    payload: (await response.json().catch(() => null)) as unknown,
  };
}

function ExpandedRecordDetails({ record }: { record: FeedbackRecord }) {
  const detailGroups = [
    {
      title: "Form",
      items: [
        ["Source File", record.sourceFileName],
        ["City / Area Name", record.cityAreaName],
        ["Milano SKU Tested", record.milanoSkuTested],
        ["Cigarette Filter Type", record.cigaretteFilterType],
      ],
    },
    {
      title: "Respondent",
      items: [
        ["Respondent Type", record.respondentType],
        ["Age Group", record.respondentAgeGroup],
        ["Smoking Frequency", record.smokingFrequency],
        ["Brand Smoked Most Often", record.brandSmokedMostOften],
      ],
    },
    {
      title: "Product",
      items: [
        ["Draw Effort", record.drawEffort],
        ["Smoke Volume", record.smokeVolume],
        ["Smoke Smoothness", record.smokeSmoothness],
        ["Taste / Flavor Feeling", record.tasteFlavorFeeling],
        ["Aftertaste Feeling", record.aftertasteFeeling],
        ["Filter Comfort Feel", record.filterComfortFeel],
        ["Burning Speed", record.burningSpeed],
        ["Ash Quality / Color", record.ashQualityColor],
        ["Taste / Flavor Consistency", record.tasteFlavorConsistency],
      ],
    },
    {
      title: "Pack and Value",
      items: [
        ["Outer Pack Visual Appeal", record.outerPackVisualAppeal],
        ["Pack Colour Attractiveness", record.packColourAttractiveness],
        [
          "Pack Quality / Feel / Opening Strength",
          record.packQualityFeelOpeningStrength,
        ],
        ["Price Black", record.priceBlack],
        ["Price Gold", record.priceGold],
        ["Price Cherry", record.priceCherry],
        ["Would Buy", record.wouldBuy],
        ["Would Recommend", record.wouldRecommend],
      ],
    },
    {
      title: "Comments",
      items: [
        ["Overall Satisfaction Rating", record.overallSatisfactionRating],
        ["Main Reason For Rating", record.mainReasonForRating],
        ["Liked Most", record.likedMost],
        ["Should Improve", record.shouldImprove],
        ["Confidence Notes", record.confidenceNotes.join(" | ") || "—"],
        ["Missing Fields", record.missingFields.join(" | ") || "—"],
      ],
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {detailGroups.map((group) => (
        <div
          key={group.title}
          className="rounded-[22px] border border-border/70 bg-white/85 p-4"
        >
          <p className="mb-3 text-sm font-semibold text-foreground">{group.title}</p>
          <div className="space-y-2">
            {group.items.map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col gap-1 rounded-[16px] bg-secondary/35 px-3 py-2"
              >
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {label}
                </span>
                <span className="whitespace-pre-line text-sm text-foreground">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
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
