import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(87,132,255,0.12),transparent_36%),radial-gradient(circle_at_80%_15%,rgba(74,222,128,0.1),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-32 mx-auto h-[520px] max-w-6xl rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.75),transparent_68%)] blur-3xl" />
      <main
        className={cn(
          "relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
