"use client";

import type { WeeklyVerdict } from "@/lib/adherence";

interface WeeklyVerdictCardProps {
  verdict: WeeklyVerdict;
}

const toneClass: Record<WeeklyVerdict["tone"], string> = {
  good: "text-[hsl(var(--chart-3))]",
  mixed: "text-[hsl(var(--chart-4))]",
  bad: "text-[hsl(var(--destructive))]",
};

function fmtSigned(n: number, unit: string) {
  const s = n > 0 ? "+" : "";
  return `${s}${n.toFixed(1)}${unit}`;
}

/** The computed weekly judgement over the last 7 days. */
export function WeeklyVerdictCard({ verdict }: WeeklyVerdictCardProps) {
  const { daysHeld, totalDays, avgDeficit, workouts, mindHours, weightDelta, verdict: line, tone } =
    verdict;

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Weekly Verdict
        </h3>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">last {totalDays} days</span>
      </div>

      <p className={`text-xl font-bold ${toneClass[tone]}`}>{line}</p>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
        Line held {daysHeld} of {totalDays} days.
      </p>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Stat label="Avg deficit" value={avgDeficit != null ? `${avgDeficit.toLocaleString()} cal` : "—"} />
        <Stat label="Workouts" value={`${workouts}`} />
        <Stat label="Deep work" value={`${mindHours.toFixed(1)} h`} />
        <Stat
          label="Weight"
          value={weightDelta != null ? fmtSigned(weightDelta, "kg") : "—"}
          accent={weightDelta != null ? (weightDelta < 0 ? "good" : weightDelta > 0 ? "bad" : undefined) : undefined}
        />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "good" | "bad";
}) {
  const color =
    accent === "good"
      ? "text-[hsl(var(--chart-3))]"
      : accent === "bad"
      ? "text-[hsl(var(--destructive))]"
      : "text-[hsl(var(--foreground))]";
  return (
    <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
