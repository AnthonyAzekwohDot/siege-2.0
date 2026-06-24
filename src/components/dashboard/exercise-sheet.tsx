"use client";

import { X, TrendingUp, PlayCircle, ArrowUpCircle } from "lucide-react";
import type { Exercise } from "@/lib/types";
import type { ExerciseSession } from "@/lib/queries";
import { getProgressionTarget, exerciseSeries } from "@/lib/overload";
import { exerciseFormKey, exerciseVideoUrl } from "@/lib/exercise-guide";
import { LiftChart } from "@/components/dashboard/lift-chart";

interface ExerciseSheetProps {
  exercise: Exercise;
  date: string;
  history: ExerciseSession[];
  targetSets: number;
  onClose: () => void;
}

/** The exercise detail sheet: how-to + form key + a real video demo, the
 *  progressive-overload target, and the strength trend — all in one place. */
export function ExerciseSheet({ exercise, date, history, targetSets, onClose }: ExerciseSheetProps) {
  const target = getProgressionTarget(exercise, history, date, targetSets);
  const series = exerciseSeries(history);
  const formKey = exerciseFormKey(exercise.name);
  const videoUrl = exerciseVideoUrl(exercise.name);
  const bw = !!exercise.isBodyweight;

  const bestE1RM = series.reduce((m, p) => Math.max(m, p.topE1RM), 0);
  const bestReps = series.reduce((m, p) => Math.max(m, p.topReps), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[88dvh] overflow-y-auto rounded-t-2xl bg-[hsl(var(--card))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 pb-3 pt-5">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{exercise.name}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Muscle chips */}
          {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {exercise.muscleGroups.map((m) => (
                <span key={m} className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                  {m}
                </span>
              ))}
            </div>
          )}

          {/* Progressive overload target */}
          <section className={`rounded-xl p-4 ${target.readyToLevelUp ? "bg-[hsl(var(--chart-3))/0.12]" : "bg-[hsl(var(--muted))]"}`}>
            <div className="mb-1 flex items-center gap-2">
              {target.readyToLevelUp ? (
                <ArrowUpCircle className="h-4 w-4 text-[hsl(var(--chart-3))]" />
              ) : (
                <TrendingUp className="h-4 w-4 text-[hsl(var(--primary))]" />
              )}
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                {target.readyToLevelUp ? "Ready to level up" : "Today's target"}
              </h4>
            </div>
            <p className="text-sm text-[hsl(var(--foreground))]">{target.suggestion}</p>
            <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
              {target.targetSets} sets
              {exercise.repRange ? ` × ${exercise.repRange[0]}–${exercise.repRange[1]} reps` : ` × ${exercise.reps}`}
              {target.lastSummary && ` · last ${target.lastSummary}`}
            </p>
          </section>

          {/* How to */}
          <section>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              How to
            </h4>
            {exercise.instructions && (
              <p className="text-sm leading-relaxed text-[hsl(var(--foreground))]">{exercise.instructions}</p>
            )}
            {formKey && (
              <p className="mt-2 text-sm">
                <span className="font-semibold text-[hsl(var(--primary))]">Form key: </span>
                <span className="text-[hsl(var(--foreground))]">{formKey}</span>
              </p>
            )}
            {exercise.homeAlt && (
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="font-semibold text-[hsl(var(--foreground))]">Home (15kg): </span>
                {exercise.homeAlt}
              </p>
            )}
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-3 text-sm font-semibold text-[hsl(var(--foreground))] active:opacity-70"
            >
              <PlayCircle className="h-4 w-4 text-[hsl(var(--primary))]" /> Watch demo
            </a>
          </section>

          {/* Progress */}
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Your progress
              </h4>
              {(bestE1RM > 0 || bestReps > 0) && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Best {bw ? `${bestReps} reps` : `${bestE1RM.toFixed(1)}kg e1RM`}
                </span>
              )}
            </div>
            <LiftChart points={series} bodyweight={bw} />
          </section>
        </div>
      </div>
    </div>
  );
}
