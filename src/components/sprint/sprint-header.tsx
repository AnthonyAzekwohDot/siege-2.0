"use client";

import Link from "next/link";
import { Flag, ChevronRight } from "lucide-react";
import type { SprintProgress, WeightProjection } from "@/lib/sprint";

interface SprintHeaderProps {
  progress: SprintProgress;
  phaseLabel: string;
  isDeload: boolean;
  projection?: WeightProjection | null;
}

function fmtKg(n: number) {
  return `${n.toFixed(1)}kg`;
}

export function SprintHeader({ progress, phaseLabel, isDeload, projection }: SprintHeaderProps) {
  // ---- No anchor yet: a CTA to start the sprint ----
  if (!progress.active) {
    return (
      <Link
        href="/settings"
        className="block glass-card p-5 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              The 90-Day Sprint
            </p>
            <p className="text-lg font-bold text-[hsl(var(--foreground))] mt-1">
              Set your start line
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
              Anchor Day 0 to start the clock and the training phases.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))] shrink-0" />
        </div>
      </Link>
    );
  }

  // ---- Anchored but in the future ----
  if (progress.notStarted) {
    const inDays = 1 - progress.dayRaw;
    return (
      <section className="glass-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          The 90-Day Sprint
        </p>
        <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">
          Starts in {inDays} day{inDays === 1 ? "" : "s"}
        </p>
      </section>
    );
  }

  const pct = Math.round(progress.pct * 100);

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          The 90-Day Sprint
        </p>
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            isDeload
              ? "bg-[hsl(var(--chart-4))/0.15] text-[hsl(var(--chart-4))]"
              : "bg-[hsl(var(--primary))/0.12] text-[hsl(var(--primary))]"
          }`}
        >
          {phaseLabel}
        </span>
      </div>

      {/* Day counter */}
      <div className="flex items-end justify-between mt-2">
        {progress.isComplete ? (
          <p className="text-3xl font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Flag className="w-6 h-6 text-[hsl(var(--chart-3))]" />
            Sprint complete
          </p>
        ) : (
          <p className="text-3xl font-bold text-[hsl(var(--foreground))] whitespace-nowrap">
            Day {progress.day}
            <span className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">
              {" "}
              / {progress.totalDays}
            </span>
          </p>
        )}
        {!progress.isComplete && (
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            {progress.daysLeft} day{progress.daysLeft === 1 ? "" : "s"} left
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden mt-3">
        <div
          className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Projection one-liner */}
      {projection?.projectedDay90 != null && projection.goal != null && (
        <p className="text-xs mt-2.5 text-[hsl(var(--muted-foreground))]">
          On this trend:{" "}
          <span
            className={`font-semibold ${
              projection.onPace
                ? "text-[hsl(var(--chart-3))]"
                : "text-[hsl(var(--destructive))]"
            }`}
          >
            {fmtKg(projection.projectedDay90)} by Day 90
          </span>{" "}
          · goal {fmtKg(projection.goal)}
        </p>
      )}
    </section>
  );
}
