"use client";

import { AlertCircle, Copy, FileJson, Sheet, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotesPanel } from "@/components/document-extractor/notes-panel";
import { StructuredFieldsGrid } from "@/components/document-extractor/structured-fields-grid";
import { TextPanel } from "@/components/document-extractor/text-panel";
import { toStructuredFieldViews, type ExtractionResult } from "@/lib/types";

type ResultTabsProps = {
  errorMessage?: string | null;
  result: ExtractionResult | null;
  isProcessing: boolean;
  onCopy: () => void;
  onDownloadJson: () => void;
  onDownloadExcel: () => void;
  onClear: () => void;
};

export function ResultTabs({
  errorMessage,
  result,
  isProcessing,
  onCopy,
  onDownloadJson,
  onDownloadExcel,
  onClear,
}: ResultTabsProps) {
  if (isProcessing) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="gap-3">
          <CardTitle>Extraction results</CardTitle>
          <CardDescription>
            Reading the document, mapping fields, translating content, and
            validating the response shape.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-[24px]" />
            ))}
          </div>
          <Skeleton className="h-44 rounded-[28px]" />
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Extraction results</CardTitle>
          <CardDescription>
            The structured output appears here after you process a selected
            document.
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
                  Extraction error
                </Badge>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  The document could not be processed
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
                  Ready for a live extraction result
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Upload a document and run processing to reveal classification,
                  key details, transcription, translation, and reviewer notes.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Extraction results</CardTitle>
            <CardDescription>
              Live structured output returned from the extraction API.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onCopy} size="sm" variant="outline">
              <Copy className="size-4" />
              Copy
            </Button>
            <Button onClick={onDownloadJson} size="sm" variant="outline">
              <FileJson className="size-4" />
              Download JSON
            </Button>
            <Button onClick={onDownloadExcel} size="sm" variant="outline">
              <Sheet className="size-4" />
              Download Excel
            </Button>
            <Button onClick={onClear} size="sm" variant="ghost">
              <Trash2 className="size-4" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="structured">
          <TabsList>
            <TabsTrigger value="structured">Structured Fields</TabsTrigger>
            <TabsTrigger value="raw">Raw Transcription</TabsTrigger>
            <TabsTrigger value="translation">English Translation</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="structured">
            <StructuredFieldsGrid
              documentTitle={result.documentTitle}
              documentSummary={result.documentSummary}
              documentType={result.documentType}
              detectedLanguage={result.detectedLanguage}
              fields={toStructuredFieldViews(result.fields)}
              keyDetails={result.keyDetails}
              rawFields={result.fields}
              missingCount={result.missingOrUnclearFields.length}
            />
          </TabsContent>

          <TabsContent value="raw">
            <TextPanel
              content={result.rawTranscription}
              description="A realistic multiline transcription block as if OCR and handwriting recognition had already run."
              title="Raw transcription"
            />
          </TabsContent>

          <TabsContent value="translation">
            <TextPanel
              content={result.englishTranslation}
              description="A clean English summary suitable for downstream workflows and review."
              title="English translation"
            />
          </TabsContent>

          <TabsContent value="notes">
            <NotesPanel
              confidenceNotes={result.confidenceNotes}
              missingOrUnclearFields={result.missingOrUnclearFields}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
