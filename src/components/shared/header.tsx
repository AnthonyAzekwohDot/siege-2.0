"use client";

import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="glass-header sticky top-0 z-40 px-4 py-3">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
          <h1 className="text-lg font-bold tracking-wide text-[hsl(var(--foreground))]">
            SIEGE
          </h1>
        </div>
        <p className="hidden md:block text-sm text-[hsl(var(--muted-foreground))] font-medium">
          We Don&apos;t Negotiate With The Plan
        </p>
      </div>
    </header>
  );
}
