import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { StructuredField } from "@/components/document-extractor/types";

type StructuredFieldsGridProps = {
  fields: StructuredField[];
  detectedLanguage: string;
};

export function StructuredFieldsGrid({
  fields,
  detectedLanguage,
}: StructuredFieldsGridProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">Detected language: {detectedLanguage}</Badge>
        <Badge variant="secondary">Mock extraction</Badge>
      </div>
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
    </div>
  );
}
