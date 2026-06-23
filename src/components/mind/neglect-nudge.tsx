"use client";

import { Crosshair } from "lucide-react";
import type { MindDailyLog } from "@/lib/types";
import { fundamentalStats, neglectedFundamentals } from "@/lib/mastery";

interface NeglectNudgeProps {
  allLogs: MindDailyLog[];
  today: string;
}

/** Spaced-repetition nudge: surfaces the most neglected fundamental as today's
 *  target so the weakest skill gets trained, not the most comfortable one. */
export function NeglectNudge({ allLogs, today }: NeglectNudgeProps) {
  const stats = fundamentalStats(allLogs, today);
  const neglected = neglectedFundamentals(stats, 3);
  const top = neglected[0];
  if (!top) return null;

  // Only nudge when there is genuine neglect (never drilled, or > 3 days stale).
  const worth = top.daysSince == null || top.daysSince > 3;
  if (!worth) return null;

  return (
    <section className="glass-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Crosshair className="w-4 h-4 text-[hsl(var(--primary))]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Target Today
        </h3>
      </div>
      <p className="text-lg font-bold text-[hsl(var(--foreground))]">{top.label}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
        {top.daysSince == null
          ? "Never drilled this window."
          : `${top.daysSince} days since you last drilled it.`}{" "}
        Lead with your weakest.
      </p>
      {neglected.length > 1 && (
        <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1.5">
          Also stale: {neglected.slice(1).map((n) => n.label).join(" · ")}
        </p>
      )}
    </section>
  );
}
