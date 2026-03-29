import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TextPanelProps = {
  title: string;
  description: string;
  content: string;
};

export function TextPanel({ title, description, content }: TextPanelProps) {
  return (
    <Card className="rounded-[28px] border-border/80 bg-white/90 shadow-sm">
      <CardHeader className="gap-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-[24px] border border-border/70 bg-secondary/35 p-5">
          <p className="whitespace-pre-line text-sm leading-7 text-foreground">
            {content}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
