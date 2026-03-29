import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type NotesPanelProps = {
  notes: string[];
};

export function NotesPanel({ notes }: NotesPanelProps) {
  return (
    <Card className="rounded-[28px] border-border/80 bg-white/90 shadow-sm">
      <CardHeader className="gap-2">
        <CardTitle>Review notes</CardTitle>
        <CardDescription>
          Confidence and uncertainty details that an operator would likely check.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notes.map((note, index) => (
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
        ))}
      </CardContent>
    </Card>
  );
}
