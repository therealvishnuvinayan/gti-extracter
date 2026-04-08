import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { feedbackFieldGroups } from "@/lib/feedback-field-groups";
import {
  hasAnyNormalizedFeedbackValue,
  normalizedFeedbackFieldLabels,
  type ProcessedFeedbackDocument,
} from "@/lib/types";

type StructuredFieldsGridProps = {
  document: ProcessedFeedbackDocument;
};

export function StructuredFieldsGrid({ document }: StructuredFieldsGridProps) {
  const hasNormalizedValues = hasAnyNormalizedFeedbackValue(document.normalized);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={document.status === "completed" ? "success" : "destructive"}>
          {document.status === "completed" ? "Processing complete" : "Needs review"}
        </Badge>
        <Badge variant="secondary">
          {document.pageCount} page{document.pageCount === 1 ? "" : "s"}
        </Badge>
        {document.normalized.missingOrUnclearFields.length > 0 ? (
          <Badge variant="secondary">
            {document.normalized.missingOrUnclearFields.length} field
            {document.normalized.missingOrUnclearFields.length === 1 ? "" : "s"} flagged
          </Badge>
        ) : null}
        {document.normalized.confidenceNotes.length > 0 ? (
          <Badge variant="outline">
            {document.normalized.confidenceNotes.length} note
            {document.normalized.confidenceNotes.length === 1 ? "" : "s"}
          </Badge>
        ) : null}
      </div>

      {document.errorMessage ? (
        <Card className="rounded-[24px] border-rose-100 bg-[linear-gradient(180deg,#fff7f7_0%,#fff_100%)]">
          <CardContent className="p-5 text-sm leading-6 text-rose-700">
            {document.errorMessage}
          </CardContent>
        </Card>
      ) : null}

      {!hasNormalizedValues ? (
        <Card className="rounded-[24px] border-border/70 bg-white/90 shadow-sm">
          <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
            No reliable answers were captured for this file yet. Use the source pages
            and notes tabs to review what needs attention.
          </CardContent>
        </Card>
      ) : null}

      {feedbackFieldGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {group.fields.map((field) => (
              <Card
                key={field}
                className="rounded-[24px] border-border/70 bg-white/90 shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {normalizedFeedbackFieldLabels[field]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-base font-semibold tracking-tight text-foreground">
                    {document.normalized[field] || "Not provided"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
