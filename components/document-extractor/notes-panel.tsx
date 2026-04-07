import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProcessedFeedbackDocument } from "@/lib/types";

type NotesPanelProps = {
  document: ProcessedFeedbackDocument;
};

export function NotesPanel({ document }: NotesPanelProps) {
  return (
    <Card className="rounded-[28px] border-border/80 bg-white/90 shadow-sm">
      <CardHeader className="gap-2">
        <CardTitle>Review notes</CardTitle>
        <CardDescription>
          Highlighted items worth checking before sharing or exporting this record.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {document.errorMessage ? (
          <div className="rounded-[22px] border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-700">
            {document.errorMessage}
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Confidence notes</p>
          {document.normalized.confidenceNotes.length > 0 ? (
            document.normalized.confidenceNotes.map((note, index) => (
              <div
                key={`${note}-${index}`}
                className="flex items-start gap-3 rounded-[22px] border border-border/70 bg-secondary/35 p-4"
              >
                {index === 0 ? (
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                )}
                <p className="text-sm leading-6 text-foreground">{note}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-border/70 bg-secondary/35 p-4 text-sm text-muted-foreground">
              No review notes were added for this file.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Missing or unclear fields
          </p>
          {document.normalized.missingOrUnclearFields.length > 0 ? (
            document.normalized.missingOrUnclearFields.map((field) => (
              <div
                key={field}
                className="rounded-[22px] border border-border/70 bg-white/80 p-4 text-sm text-foreground"
              >
                {field}
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-border/70 bg-white/80 p-4 text-sm text-muted-foreground">
              No missing or unclear answers were flagged for this file.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
