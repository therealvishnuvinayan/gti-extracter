"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-border/80 bg-white text-foreground shadow-xl",
          title: "text-sm font-semibold",
          description: "text-sm text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-secondary text-secondary-foreground",
        },
      }}
    />
  );
}
