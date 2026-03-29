import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  hasAnyStructuredFieldValue,
  type ExtractionFields,
  type GenericKeyDetail,
  type StructuredFieldView,
} from "@/lib/types";

type StructuredFieldsGridProps = {
  documentTitle: string;
  documentType: string;
  detectedLanguage: string;
  documentSummary: string;
  keyDetails: GenericKeyDetail[];
  fields: StructuredFieldView[];
  rawFields: ExtractionFields;
  missingCount: number;
};

export function StructuredFieldsGrid({
  documentTitle,
  documentType,
  detectedLanguage,
  documentSummary,
  keyDetails,
  fields,
  rawFields,
  missingCount,
}: StructuredFieldsGridProps) {
  const hasFormFields = hasAnyStructuredFieldValue(rawFields);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">Detected language: {detectedLanguage}</Badge>
        <Badge variant="secondary">Document type: {documentType || "Unknown"}</Badge>
        {documentTitle ? <Badge variant="outline">{documentTitle}</Badge> : null}
        {missingCount > 0 ? (
          <Badge variant="secondary">
            {missingCount} item{missingCount > 1 ? "s" : ""} need review
          </Badge>
        ) : null}
      </div>

      <Card className="rounded-[24px] border-border/70 bg-white/90 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Document overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm leading-7 text-foreground">
            {documentSummary || "No document summary was returned."}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Key details</h3>
          <p className="text-sm text-muted-foreground">
            Important information extracted from the document regardless of format.
          </p>
        </div>
        {keyDetails.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {keyDetails.map((detail, index) => (
              <Card
                key={`${detail.label}-${index}`}
                className="rounded-[24px] border-border/70 bg-white/90 shadow-sm"
              >
                <CardContent className="space-y-2 p-5">
                  <p className="text-sm font-medium text-muted-foreground">
                    {detail.label}
                  </p>
                  <p className="text-base font-semibold tracking-tight text-foreground">
                    {detail.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-border/70 bg-white/90 p-5 text-sm text-muted-foreground shadow-sm">
            No generic key details were returned for this document.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Customer-form fields
          </h3>
          <p className="text-sm text-muted-foreground">
            These fields are only populated when the uploaded document actually
            contains customer-form-style information.
          </p>
        </div>
        {hasFormFields ? (
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <Card
                key={field.id}
                className="rounded-[24px] border-border/70 bg-white/90 shadow-sm"
              >
                <CardContent className="space-y-2 p-5">
                  <p className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </p>
                  <p className="text-base font-semibold tracking-tight text-foreground">
                    {field.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-border/70 bg-white/90 p-5 text-sm text-muted-foreground shadow-sm">
            This document does not appear to contain customer-form-specific fields
            such as name, shop name, phone number, or product selections.
          </div>
        )}
      </div>
    </div>
  );
}
