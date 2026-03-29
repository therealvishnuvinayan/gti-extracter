import { Languages, Sparkles, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="animate-fade-up">
      <div className="surface grid-glow relative overflow-hidden rounded-[32px] border border-border/80 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="absolute right-5 top-5 hidden rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm sm:inline-flex">
          Frontend-only MVP
        </div>
        <div className="flex flex-col gap-6">
          <Badge variant="secondary" className="w-fit bg-white/80 text-foreground">
            <Sparkles className="size-3.5" />
            Handwritten Form Extractor
          </Badge>
          <div className="max-w-3xl space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-balance text-foreground sm:text-5xl lg:text-6xl">
              Present handwritten form extraction like a finished AI product.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Upload a handwritten image or PDF, preview it locally, and reveal a
              polished mock extraction result set with structured fields,
              transcription, translation, and review notes.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/80 px-4 py-2">
              <WandSparkles className="size-4 text-primary" />
              Supported inputs: JPG, PNG, WEBP, PDF
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/80 px-4 py-2">
              <Languages className="size-4 text-primary" />
              Supported languages: English, Farsi, Dari
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Demo mode only. Files stay in transient frontend state, nothing is
            persisted, and refresh clears the session.
          </p>
        </div>
      </div>
    </section>
  );
}
