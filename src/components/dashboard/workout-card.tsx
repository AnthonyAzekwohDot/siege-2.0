"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Footprints,
  ChevronDown,
  Minus,
  Plus,
  Trophy,
  Timer,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { DaySchedule, Exercise, SetEntry, PhaseInfo, DailyLog } from "@/lib/types";
import { useLogSet, useExerciseHistory } from "@/hooks/use-queries";
import type { ExerciseSession } from "@/lib/queries";

const REST_SECONDS = 90;

interface WorkoutCardProps {
  schedule: DaySchedule;
  date: string;
  exerciseLogs: Record<string, SetEntry[]>;
  morningWalkCompleted: boolean;
  eveningWalkCompleted: boolean;
  phase: PhaseInfo;
  onToggleMorningWalk: () => void;
  onToggleEveningWalk: () => void;
  className?: string;
}

function est1RM(load: number | null, reps: number | null): number {
  if (load == null || reps == null || reps <= 0) return 0;
  return load * (1 + reps / 30);
}

/** Best loaded est-1RM and best bodyweight rep count across prior sessions. */
function bestFrom(sessions: ExerciseSession[], excludeDate: string) {
  let bestE1RM = 0;
  let bestReps = 0;
  for (const s of sessions) {
    if (s.date === excludeDate) continue;
    for (const set of s.sets) {
      if (!set) continue;
      bestE1RM = Math.max(bestE1RM, est1RM(set.load, set.reps));
      if (set.reps != null) bestReps = Math.max(bestReps, set.reps);
    }
  }
  return { bestE1RM, bestReps };
}

function lastSessionLabel(sessions: ExerciseSession[], excludeDate: string): string | null {
  const prev = sessions.find((s) => s.date !== excludeDate);
  if (!prev) return null;
  const top = prev.sets
    .filter((s) => s && (s.reps != null || s.load != null))
    .sort((a, b) => est1RM(b.load, b.reps) - est1RM(a.load, a.reps))[0];
  if (!top) return null;
  const when = prev.date.slice(5); // MM-DD
  if (top.load == null) return `Last: ${top.reps ?? 0} reps (${when})`;
  return `Last: ${top.load}kg x ${top.reps ?? 0} (${when})`;
}

export function WorkoutCard({
  schedule,
  date,
  exerciseLogs,
  morningWalkCompleted,
  eveningWalkCompleted,
  phase,
  onToggleMorningWalk,
  onToggleEveningWalk,
  className,
}: WorkoutCardProps) {
  // Single shared rest timer for the card.
  const [restEndsAt, setRestEndsAt] = React.useState<number | null>(null);
  const startRest = React.useCallback(() => setRestEndsAt(Date.now() + REST_SECONDS * 1000), []);

  const exercises = schedule.exercises;
  const doneCount = exercises.filter(
    (e) => (exerciseLogs[e.name] ?? []).some((s) => s && s.done)
  ).length;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{schedule.focus}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {phase.label}
          </Badge>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{schedule.purpose}</p>
        {phase.isDeload && (
          <p className="mt-1 text-xs font-medium text-[hsl(var(--chart-4))]">
            Deload week — sets are cut, leave reps in the tank. Recover, do not push.
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Walks */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={morningWalkCompleted} onCheckedChange={onToggleMorningWalk} />
            <Footprints className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <span className={cn("text-sm", morningWalkCompleted && "line-through text-[hsl(var(--muted-foreground))]")}>
              AM Walk
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={eveningWalkCompleted} onCheckedChange={onToggleEveningWalk} />
            <Footprints className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <span className={cn("text-sm", eveningWalkCompleted && "line-through text-[hsl(var(--muted-foreground))]")}>
              PM Walk
            </span>
          </label>
        </div>

        {exercises.length === 0 ? (
          <p className="py-3 text-sm text-[hsl(var(--muted-foreground))]">
            Rest day. The work today is the walk.
          </p>
        ) : (
          <>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {doneCount}/{exercises.length} exercises · beat last session, even by one rep
            </p>
            <div className="space-y-2">
              {exercises.map((ex) => (
                <ExerciseLogger
                  key={ex.name}
                  exercise={ex}
                  date={date}
                  todaySets={exerciseLogs[ex.name] ?? []}
                  phase={phase}
                  onSetDone={startRest}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>

      {restEndsAt && <RestTimer endsAt={restEndsAt} onClose={() => setRestEndsAt(null)} onAdd={() => setRestEndsAt((t) => (t ?? Date.now()) + 30000)} />}
    </Card>
  );
}

// ---------- One exercise: cues + per-set logging ----------

function ExerciseLogger({
  exercise,
  date,
  todaySets,
  phase,
  onSetDone,
}: {
  exercise: Exercise;
  date: string;
  todaySets: SetEntry[];
  phase: PhaseInfo;
  onSetDone: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const logSet = useLogSet(date);
  const { data: history = [] } = useExerciseHistory(exercise.name);

  const targetSets = Math.max(1, Math.round(exercise.sets * phase.setMultiplier));
  const last = lastSessionLabel(history, date);
  const { bestE1RM, bestReps } = bestFrom(history, date);

  const prevSession = history.find((s) => s.date !== date);
  const [lo] = exercise.repRange ?? [Number(exercise.reps) || 10];

  function defaultsFor(index: number): { load: number | null; reps: number | null } {
    const existing = todaySets[index];
    if (existing) return { load: existing.load, reps: existing.reps };
    const prevSet = prevSession?.sets?.[index] ?? prevSession?.sets?.[prevSession.sets.length - 1];
    if (exercise.isBodyweight) return { load: null, reps: prevSet?.reps ?? 0 };
    return { load: prevSet?.load ?? 15, reps: prevSet?.reps ?? lo };
  }

  function commit(index: number, patch: Partial<SetEntry>) {
    // Build from the freshest cache, not the rendered closure, so rapid taps
    // compose instead of overwriting each other.
    const freshSets =
      queryClient.getQueryData<DailyLog>(["daily-log", date])?.exercise_logs?.[exercise.name] ?? todaySets;
    const current = freshSets[index];
    const base: SetEntry = current ?? {
      set: index + 1,
      ...defaultsFor(index),
      done: false,
      ts: new Date().toISOString(),
    };
    const next: SetEntry = { ...base, ...patch, set: index + 1, ts: new Date().toISOString() };
    const wasDone = current?.done ?? false;
    logSet.mutate({ exerciseName: exercise.name, setIndex: index, entry: next });
    if (!wasDone && next.done) onSetDone();
  }

  function isPR(entry: { load: number | null; reps: number | null }): boolean {
    if (exercise.isBodyweight) return (entry.reps ?? 0) > 0 && (entry.reps ?? 0) >= bestReps && bestReps > 0;
    return est1RM(entry.load, entry.reps) > bestE1RM && bestE1RM > 0;
  }

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-2.5">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => setOpen((o) => !o)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">{exercise.name}</p>
            <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform", open && "rotate-180")} />
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {targetSets} x {exercise.reps}
            {phase.isDeload && targetSets !== exercise.sets && " (deload)"}
          </p>
          {last && <p className="text-[11px] text-[hsl(var(--primary))] mt-0.5">{last}</p>}
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-1.5 rounded-md bg-[hsl(var(--muted))] p-2.5 text-xs text-[hsl(var(--muted-foreground))]">
          {exercise.instructions && <p>{exercise.instructions}</p>}
          {exercise.homeAlt && (
            <p>
              <span className="font-semibold text-[hsl(var(--foreground))]">Home (15kg): </span>
              {exercise.homeAlt}
            </p>
          )}
          {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {exercise.muscleGroups.map((m) => (
                <span key={m} className="rounded bg-[hsl(var(--background))] px-1.5 py-0.5 text-[10px]">
                  {m}
                </span>
              ))}
            </div>
          )}
          {exercise.diagram && (
            <pre className="overflow-x-auto whitespace-pre font-mono text-[10px] leading-tight text-[hsl(var(--foreground))]">
              {exercise.diagram}
            </pre>
          )}
        </div>
      )}

      <div className="mt-2 space-y-1">
        {Array.from({ length: targetSets }, (_, i) => {
          const entry = todaySets[i];
          const vals = entry ?? { ...defaultsFor(i), done: false };
          const pr = isPR(vals);
          return (
            <SetRow
              key={i}
              index={i}
              isBodyweight={!!exercise.isBodyweight}
              load={vals.load}
              reps={vals.reps}
              done={vals.done ?? false}
              pr={pr}
              onLoad={(load) => commit(i, { load })}
              onReps={(reps) => commit(i, { reps })}
              onToggleDone={() => commit(i, { done: !(entry?.done ?? false) })}
            />
          );
        })}
      </div>

      {logSet.isError && (
        <p className="mt-1.5 text-[11px] text-[hsl(var(--destructive))]">
          Could not save that set. If you just deployed, run the workout DB migration.
        </p>
      )}
    </div>
  );
}

// ---------- One set row: steppers + done ----------

function SetRow({
  index,
  isBodyweight,
  load,
  reps,
  done,
  pr,
  onLoad,
  onReps,
  onToggleDone,
}: {
  index: number;
  isBodyweight: boolean;
  load: number | null;
  reps: number | null;
  done: boolean;
  pr: boolean;
  onLoad: (load: number) => void;
  onReps: (reps: number) => void;
  onToggleDone: () => void;
}) {
  return (
    <div className={cn("flex items-center gap-2 rounded-md px-1 py-1", done && "bg-[hsl(var(--chart-3))/0.1]")}>
      <span className="w-4 text-center text-xs font-semibold text-[hsl(var(--muted-foreground))]">{index + 1}</span>

      {!isBodyweight && (
        <Stepper
          value={load ?? 0}
          unit="kg"
          step={1}
          min={0}
          onChange={(v) => onLoad(v)}
        />
      )}

      <Stepper
        value={reps ?? 0}
        unit={isBodyweight ? "reps" : "x"}
        step={1}
        min={0}
        onChange={(v) => onReps(v)}
      />

      {pr && (
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-[hsl(var(--chart-4))]">
          <Trophy className="h-3 w-3" /> PR
        </span>
      )}

      <button
        onClick={onToggleDone}
        aria-label={done ? "Mark set not done" : "Mark set done"}
        className={cn(
          "ml-auto flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
          done
            ? "border-[hsl(var(--chart-3))] bg-[hsl(var(--chart-3))] text-white"
            : "border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))]"
        )}
      >
        <svg className="h-4 w-4" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function Stepper({
  value,
  unit,
  step,
  min,
  onChange,
}: {
  value: number;
  unit: string;
  step: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label="decrease"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))] active:bg-[hsl(var(--muted))]"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-[3rem] text-center">
        <span className="text-sm font-bold tabular-nums">{value}</span>
        <span className="ml-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">{unit}</span>
      </div>
      <button
        onClick={() => onChange(value + step)}
        aria-label="increase"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))] active:bg-[hsl(var(--muted))]"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------- Rest timer ----------

function RestTimer({ endsAt, onClose, onAdd }: { endsAt: number; onClose: () => void; onAdd: () => void }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));

  React.useEffect(() => {
    if (remaining === 0) {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(200);
      const t = setTimeout(onClose, 1200);
      return () => clearTimeout(t);
    }
  }, [remaining, onClose]);

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-2xl items-center gap-3 px-4">
      <div className="flex flex-1 items-center gap-3 rounded-xl bg-[hsl(var(--foreground))] px-4 py-2.5 text-[hsl(var(--background))] shadow-lg">
        <Timer className="h-4 w-4" />
        <span className="text-sm font-bold tabular-nums">{remaining}s</span>
        <span className="text-xs opacity-70">rest</span>
        <button onClick={onAdd} className="ml-auto rounded-md bg-white/15 px-2 py-1 text-xs font-medium">
          +30s
        </button>
        <button onClick={onClose} aria-label="skip rest" className="rounded-md p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
