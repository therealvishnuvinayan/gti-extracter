import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  hasAnyNormalizedFeedbackValue,
  normalizedFeedbackFieldLabels,
  type ProcessedFeedbackDocument,
  type NormalizedFeedbackScalarFieldKey,
} from "@/lib/types";

type StructuredFieldsGridProps = {
  document: ProcessedFeedbackDocument;
};

const FIELD_GROUPS: Array<{
  title: string;
  description: string;
  fields: NormalizedFeedbackScalarFieldKey[];
}> = [
  {
    title: "Respondent profile",
    description: "Identity, location, and smoking-habit fields captured from the form.",
    fields: [
      "sourceFileName",
      "cityAreaName",
      "respondentType",
      "respondentAgeGroup",
      "smokingFrequency",
      "brandSmokedMostOften",
    ],
  },
  {
    title: "Product setup",
    description: "Product variant and respondent setup information.",
    fields: [
      "milanoSkuTested",
      "cigaretteFilterType",
      "wouldBuy",
      "wouldRecommend",
      "overallSatisfactionRating",
      "mainReasonForRating",
    ],
  },
  {
    title: "Product ratings",
    description: "Core product attribute ratings collected in the form.",
    fields: [
      "drawEffort",
      "smokeVolume",
      "smokeSmoothness",
      "tasteFlavorFeeling",
      "aftertasteFeeling",
      "filterComfortFeel",
      "burningSpeed",
      "ashQualityColor",
      "tasteFlavorConsistency",
    ],
  },
  {
    title: "Pack and value",
    description: "Packaging and value-for-money answers.",
    fields: [
      "outerPackVisualAppeal",
      "packColourAttractiveness",
      "packQualityFeelOpeningStrength",
      "priceValueMilanoOdysseyBlack",
      "priceValueMilanoOdysseyGold",
      "priceValueMilanoCherryVintage",
    ],
  },
  {
    title: "Open comments",
    description: "Free-text commentary from the respondent.",
    fields: ["likedMost", "shouldImprove"],
  },
];

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

      {FIELD_GROUPS.map((group) => (
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
