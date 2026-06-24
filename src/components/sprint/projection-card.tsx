"use client";

import { TrendingDown, TrendingUp, Target } from "lucide-react";
import type { WeightProjection } from "@/lib/sprint";

interface ProjectionCardProps {
  projection: WeightProjection;
}

function fmtKg(n: number) {
  return `${n.toFixed(1)}kg`;
}

/** The Day-90 fat-loss projection: where the current weight trend lands you,
 *  measured against the goal. Renders nothing until there is weight data. */
export function ProjectionCard({ projection }: ProjectionCardProps) {
  if (!projection.hasData) return null;

  const { emaNow, ratePerWeek, projectedDay90, goal, onPace, gapToGoal } = projection;
  const losing = ratePerWeek != null && ratePerWeek < 0;

  return (
    <section className="glass-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">
        Day-90 Projection
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">Now (trend)</p>
          <p className="text-lg font-bold text-[hsl(var(--foreground))]">
            {emaNow != null ? fmtKg(emaNow) : "—"}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">Rate</p>
          <p className="text-lg font-bold flex items-center gap-1">
            {ratePerWeek != null ? (
              <>
                {losing ? (
                  <TrendingDown className="w-4 h-4 text-[hsl(var(--chart-3))]" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-[hsl(var(--destructive))]" />
                )}
                <span className="text-[hsl(var(--foreground))]">
                  {Math.abs(ratePerWeek).toFixed(2)}/wk
                </span>
              </>
            ) : (
              <span className="text-[hsl(var(--muted-foreground))] text-base font-medium">
                Need 2+ weigh-ins
              </span>
            )}
          </p>
        </div>
      </div>

      {projectedDay90 != null && (
        <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              Projected Day 90
            </span>
            <span className="text-lg font-bold text-[hsl(var(--foreground))]">
              {fmtKg(projectedDay90)}
            </span>
          </div>

          {goal != null && gapToGoal != null && (
            <div className="flex items-center gap-2 mt-2">
              <Target className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <span
                className={`text-sm font-semibold ${
                  onPace ? "text-[hsl(var(--chart-3))]" : "text-[hsl(var(--destructive))]"
                }`}
              >
                {onPace
                  ? `On pace · ${fmtKg(Math.abs(gapToGoal))} past goal`
                  : `${fmtKg(Math.abs(gapToGoal))} short of ${fmtKg(goal)} goal`}
              </span>
            </div>
          )}
        </div>
      )}

      {projectedDay90 == null && goal != null && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3">
          Set your sprint start date and log weight to see the Day-90 projection.
        </p>
      )}
    </section>
  );
}
