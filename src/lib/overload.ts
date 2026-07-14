import type { Exercise, SetEntry } from "@/lib/types";
import type { ExerciseSession } from "@/lib/queries";

// ============ PROGRESSIVE OVERLOAD + STRENGTH PROGRESS ============
// Double progression: work the rep range at a fixed load; when every working
// set hits the TOP of the range, add load and drop back to the bottom. This
// module turns the per-set log into a clear "what to do next" + the trend.

/** Epley estimated 1-rep max. 0 for bodyweight / empty sets. */
export function est1RM(load: number | null, reps: number | null): number {
  if (load == null || reps == null || reps <= 0) return 0;
  return load * (1 + reps / 30);
}

/** Smallest sane load jump: 1kg for light dumbbells, 2.5kg once heavier. */
function loadIncrement(load: number): number {
  return load <= 10 ? 1 : 2.5;
}

export interface ProgressionTarget {
  targetSets: number;
  repRange: [number, number] | null;
  /** Suggested load for today (kg), or null for bodyweight / no data. */
  workingLoad: number | null;
  /** Plain-language next step. */
  suggestion: string;
  /** Last session topped the range on every working set → time to add load. */
  readyToLevelUp: boolean;
  /** "3×10–12 @ 15kg", or null with no prior data. */
  lastSummary: string | null;
}

/** The load that the most completed sets shared (mode; ties go to the heavier). */
function modeLoad(sets: { load: number | null }[]): number {
  const counts = new Map<number, number>();
  for (const s of sets) {
    const l = s.load ?? 0;
    counts.set(l, (counts.get(l) ?? 0) + 1);
  }
  let best = 0;
  let bestCount = -1;
  for (const [l, c] of counts) {
    if (c > bestCount || (c === bestCount && l > best)) { best = l; bestCount = c; }
  }
  return best;
}

/**
 * @param displaySets the (deload-adjusted) set count to show in the label.
 * @param isDeload when true, never advise adding load, it's a recovery week.
 * Readiness is judged against the exercise's FULL prescribed set count using only
 * COMPLETED sets at the actual working load, so partial/un-done/mixed-load
 * sessions can't trigger a false "level up".
 */
export function getProgressionTarget(
  exercise: Exercise,
  history: ExerciseSession[],
  excludeDate: string,
  displaySets: number,
  isDeload = false
): ProgressionTarget {
  const range = exercise.repRange ?? null;
  const prescribed = exercise.sets;
  // The most recent session STRICTLY BEFORE the day being logged — so
  // backfilling a past day never derives "last"/defaults from a later session.
  // (history is newest-first; yyyy-MM-dd compares lexicographically.)
  const prev = history.find((s) => s.date < excludeDate);

  // ---- Bodyweight / AMRAP: chase reps, best across ALL history ----
  if (exercise.isBodyweight) {
    let allBest = 0;
    for (const s of history) {
      if (s.date === excludeDate) continue;
      for (const set of s.sets) if (set?.done) allBest = Math.max(allBest, set.reps ?? 0);
    }
    const lastDone = (prev?.sets ?? []).filter((s) => s?.done && (s.reps ?? 0) > 0);
    return {
      targetSets: displaySets, repRange: range, workingLoad: null, readyToLevelUp: false,
      lastSummary: lastDone.length
        ? `${lastDone.length}×${Math.max(...lastDone.map((s) => s.reps ?? 0))} reps`
        : null,
      suggestion: allBest > 0 ? `Beat ${allBest} reps, even by one.` : "Log your first set as a baseline.",
    };
  }

  // ---- Loaded: only completed (done) sets with a real load count ----
  const completed = (prev?.sets ?? []).filter((s) => s?.done && s.load != null && s.reps != null);
  if (!prev || completed.length === 0) {
    return {
      targetSets: displaySets, repRange: range, workingLoad: null, readyToLevelUp: false, lastSummary: null,
      suggestion: range
        ? `Pick a weight you can do for ${range[0]}–${range[1]} clean reps, then log it.`
        : "Log your first set as a baseline.",
    };
  }

  // Evaluate only the sets at the actual working load (the load most sets shared).
  const workingLoad = modeLoad(completed);
  const atLoad = completed.filter((s) => s.load === workingLoad);
  const repsArr = atLoad.map((s) => s.reps ?? 0);
  const minReps = Math.min(...repsArr);
  const maxReps = Math.max(...repsArr);
  const lastSummary = `${atLoad.length}×${minReps === maxReps ? minReps : `${minReps}–${maxReps}`} @ ${workingLoad}kg`;

  // Add load only off-deload, when the full prescribed number of working sets at
  // this load all topped the range.
  const allHitTop =
    !isDeload && range != null && atLoad.length >= prescribed && atLoad.every((s) => (s.reps ?? 0) >= range[1]);

  if (allHitTop && range) {
    const inc = loadIncrement(workingLoad);
    return {
      targetSets: displaySets, repRange: range, workingLoad: workingLoad + inc, readyToLevelUp: true, lastSummary,
      suggestion: `You topped ${range[1]} reps on every set. Add ${inc}kg → ${workingLoad + inc}kg, back down to ${range[0]} reps.`,
    };
  }

  return {
    targetSets: displaySets, repRange: range, workingLoad, readyToLevelUp: false, lastSummary,
    suggestion: range
      ? `Stay at ${workingLoad}kg, add reps toward ${range[1]} on every set.`
      : `Beat last session at ${workingLoad}kg.`,
  };
}

// ---- Progress series for the per-lift chart ----

export interface LiftPoint {
  date: string;
  topE1RM: number;
  topLoad: number;
  topReps: number;
  volume: number;
}

export function exerciseSeries(history: ExerciseSession[]): LiftPoint[] {
  return [...history]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((s) => {
      let topE1RM = 0, topLoad = 0, topReps = 0, volume = 0;
      for (const set of s.sets) {
        if (!set) continue;
        topE1RM = Math.max(topE1RM, est1RM(set.load, set.reps));
        topLoad = Math.max(topLoad, set.load ?? 0);
        topReps = Math.max(topReps, set.reps ?? 0);
        volume += (set.load ?? 0) * (set.reps ?? 0);
      }
      return { date: s.date, topE1RM: Math.round(topE1RM * 10) / 10, topLoad, topReps, volume };
    })
    .filter((p) => p.topE1RM > 0 || p.topReps > 0);
}

/** Group per-set logs from the daily logs into history per exercise. */
export function byExerciseFromLogs(
  logs: { date: string; exercise_logs?: Record<string, SetEntry[]> }[]
): Record<string, ExerciseSession[]> {
  const out: Record<string, ExerciseSession[]> = {};
  for (const log of logs) {
    const el = log.exercise_logs;
    if (!el) continue;
    for (const [name, sets] of Object.entries(el)) {
      if (!sets || sets.length === 0) continue;
      if (!sets.some((s) => s && (s.reps != null || s.load != null))) continue;
      (out[name] ??= []).push({ date: log.date, sets });
    }
  }
  return out;
}

// ---- Recent PRs across all lifts (for the Progress summary) ----

export interface LiftPR {
  exercise: string;
  date: string;
  /** "62.5kg e1RM" for loaded, "24 reps" for bodyweight. */
  value: string;
  isBodyweight: boolean;
}

/**
 * The single best session per exercise, newest-first. `bodyweightNames` marks
 * which exercises are rep-PRs vs load/e1RM-PRs.
 */
export function recentPRs(
  byExercise: Record<string, ExerciseSession[]>,
  bodyweightNames: Set<string>,
  limit = 6
): LiftPR[] {
  const prs: LiftPR[] = [];
  for (const [exercise, sessions] of Object.entries(byExercise)) {
    const bw = bodyweightNames.has(exercise);
    let best = 0;
    let bestDate = "";
    for (const s of sessions) {
      for (const set of s.sets) {
        if (!set) continue;
        const v = bw ? set.reps ?? 0 : est1RM(set.load, set.reps);
        if (v > best) { best = v; bestDate = s.date; }
      }
    }
    if (best > 0) {
      prs.push({
        exercise, date: bestDate, isBodyweight: bw,
        value: bw ? `${best} reps` : `${Math.round(best * 10) / 10}kg e1RM`,
      });
    }
  }
  return prs.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}
