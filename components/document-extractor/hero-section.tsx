import { FileSpreadsheet, ScanSearch, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="animate-fade-up">
      <div className="surface grid-glow relative overflow-hidden rounded-[32px] border border-border/80 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-6">
          <Badge variant="secondary" className="w-fit bg-white/80 text-foreground">
            <Sparkles className="size-3.5" />
            GTI Template Mode
          </Badge>
          <div className="max-w-4xl space-y-4">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-balance text-foreground sm:text-5xl lg:text-6xl">
              Turn GTI feedback forms into structured, ready-to-use records.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              Upload completed Consumer Product Testing Feedback Forms and the
              platform captures responses, organizes them into a consistent format,
              and prepares them for review, reporting, and export.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/80 px-4 py-2">
              <ScanSearch className="size-4 text-primary" />
              Built for scanned GTI feedback form PDFs and images
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/80 px-4 py-2">
              <FileSpreadsheet className="size-4 text-primary" />
              Creates clean records and Excel-ready output
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Designed for the GTI Consumer Product Testing Feedback Form with one
            fixed layout for more reliable extraction and review.
          </p>
        </div>
      </div>
    </section>
  );
}
