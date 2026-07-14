"use client";

import { X, TrendingUp, ArrowUpCircle, Activity } from "lucide-react";
import type { Exercise } from "@/lib/types";
import { useExerciseHistory } from "@/hooks/use-queries";
import { getProgressionTarget, exerciseSeries } from "@/lib/overload";
import { exerciseFormKey, exerciseMovement } from "@/lib/exercise-guide";
import { LiftChart } from "@/components/dashboard/lift-chart";
import { MuscleMap, musclesToKeys } from "@/components/dashboard/muscle-map";
import { FormDiagram } from "@/components/dashboard/form-diagram";
import { movementFor } from "@/lib/form-figure";

interface ExerciseSheetProps {
  exercise: Exercise;
  date: string;
  targetSets: number;
  isDeload?: boolean;
  onClose: () => void;
}

/** Exercise detail sheet: a muscle-map diagram + the movement, the
 *  progressive-overload target, the how-to cues, and the strength trend.
 *  Fetches its own history so the planner only queries when it's opened. */
export function ExerciseSheet({ exercise, date, targetSets, isDeload = false, onClose }: ExerciseSheetProps) {
  const { data: history = [] } = useExerciseHistory(exercise.name);
  const target = getProgressionTarget(exercise, history, date, targetSets, isDeload);
  const series = exerciseSeries(history);
  const formKey = exerciseFormKey(exercise.name);
  const movement = exerciseMovement(exercise.name);
  const worked = musclesToKeys(exercise.muscleGroups);
  const figure = movementFor(exercise.name);

  const bestE1RM = series.reduce((m, p) => Math.max(m, p.topE1RM), 0);
  const bestReps = series.reduce((m, p) => Math.max(m, p.topReps), 0);
  const bestLabel = bestE1RM > 0 ? `${bestE1RM.toFixed(1)}kg e1RM` : bestReps > 0 ? `${bestReps} reps` : null;

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
            className="-mr-2 flex h-11 w-11 items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* The movement — animated form figure */}
          {figure && (
            <section>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                The movement
              </h4>
              <div className="flex flex-col items-center rounded-xl bg-[hsl(var(--muted))] py-3">
                <FormDiagram movement={figure} exerciseName={exercise.name} height={188} />
                {movement && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs">
                    <Activity aria-hidden className="h-3.5 w-3.5 text-[hsl(var(--chart-2))]" />
                    <span className="font-medium text-[hsl(var(--foreground))]">{movement}</span>
                  </div>
                )}
              </div>
              {formKey && (
                <p className="mt-2 text-sm">
                  <span className="font-semibold text-[hsl(var(--foreground))]">Form key: </span>
                  <span className="text-[hsl(var(--foreground))]">{formKey}</span>
                </p>
              )}
            </section>
          )}

          {/* Muscles worked */}
          <section>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Muscles worked
            </h4>
            <MuscleMap worked={worked} />
            {!figure && movement && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs">
                <Activity aria-hidden className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                <span className="text-[hsl(var(--muted-foreground))]">Movement:</span>
                <span className="font-medium text-[hsl(var(--foreground))]">{movement}</span>
              </div>
            )}
            {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {exercise.muscleGroups.map((m) => (
                  <span key={m} className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </section>

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
              {isDeload && " (deload)"}
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
            {!figure && formKey && (
              <p className="mt-2 text-sm">
                <span className="font-semibold text-[hsl(var(--foreground))]">Form key: </span>
                <span className="text-[hsl(var(--foreground))]">{formKey}</span>
              </p>
            )}
            {exercise.homeAlt && (
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="font-semibold text-[hsl(var(--foreground))]">Home (15kg): </span>
                {exercise.homeAlt}
              </p>
            )}
          </section>

          {/* Progress */}
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Your progress
              </h4>
              {bestLabel && <span className="text-xs text-[hsl(var(--muted-foreground))]">Best {bestLabel}</span>}
            </div>
            <LiftChart points={series} />
          </section>
        </div>
      </div>
    </div>
  );
}
