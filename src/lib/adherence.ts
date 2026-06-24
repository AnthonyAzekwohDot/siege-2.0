import { addDays, subDays, parseISO, format } from "date-fns";
import { WORKOUT_SCHEDULE, DEEP_WORK_CATEGORIES } from "@/lib/constants";
import { defaultProteinFloor, totalProtein } from "@/lib/sprint";
import type {
  DailyLog,
  DailyNutritionSummary,
  MindDailyLog,
  UserProfile,
  DayOfWeek,
} from "@/lib/types";

// ============ LINE HELD — the unified body + mind adherence metric ============
// "We don't negotiate with the plan." A day's line holds when BOTH halves hold:
// the body (ate in deficit AND moved) and the mind (did real creative work).
// Everything here is DERIVED from the logs each load, so there is no stored
// streak state to drift out of sync.

const MAX_FREEZE_TOKENS = 3;
const RUN_PER_TOKEN = 7; // earn one freeze every 7 consecutive held days
const MIND_MIN_MINUTES = 10; // a mind block counts once it has real time on it

function ymd(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function isRestDay(date: string): boolean {
  const dow = format(parseISO(date), "EEEE").toLowerCase() as DayOfWeek;
  return WORKOUT_SCHEDULE.find((d) => d.day === dow)?.isRestDay ?? false;
}

export interface LineResult {
  key: "deficit" | "protein" | "move" | "train" | "mind";
  label: string;
  held: boolean;
  /** Not applicable today (e.g. Train on a rest day) — excluded from the score. */
  na?: boolean;
  detail: string;
}

export interface LineHeld {
  lines: LineResult[];
  bodyHeld: boolean;
  mindHeld: boolean;
  /** bodyHeld && mindHeld — the day's line held. */
  held: boolean;
  /** Fraction of applicable lines held (a softer readout than the binary). */
  score: number;
  /** Was anything logged at all today. */
  hasData: boolean;
}

export function computeLineHeld(
  date: string,
  log: DailyLog | undefined,
  summary: DailyNutritionSummary | undefined,
  mind: MindDailyLog | undefined,
  profile: UserProfile
): LineHeld {
  const meals = log?.meals ?? [];
  const mealsLogged = meals.length > 0;
  const eaten = meals.reduce((s, m) => s + m.calories, 0);

  // --- Deficit (needs the day's frozen snapshot + at least one logged meal) ---
  let deficitHeld = false;
  let deficitDetail = "unlogged";
  if (summary && mealsLogged) {
    const net = summary.tdee_snapshot - eaten;
    deficitHeld = net >= summary.deficit_target_snapshot;
    deficitDetail = `${Math.round(net)} / ${summary.deficit_target_snapshot}`;
  }

  // --- Protein floor ---
  const floor =
    profile.protein_floor_g ??
    defaultProteinFloor(profile.goal_weight_kg ?? null, profile.weight_kg);
  const protein = totalProtein(meals);
  const proteinHeld = floor > 0 && protein >= floor;

  // --- Move (steps goal OR a walk OR a logged workout) ---
  const steps = log?.steps ?? 0;
  const stepsGoal = log?.steps_goal ?? 15000;
  const walked = !!log?.morning_walk_completed || !!log?.evening_walk_completed;
  const workoutDone = (log?.completed_exercises?.length ?? 0) > 0;
  const moveHeld = steps >= stepsGoal || walked || workoutDone;

  // --- Train (auto-held on rest days) ---
  const rest = isRestDay(date);
  const trainHeld = rest || workoutDone;

  // --- Mind (>=1 real deep-work block) ---
  const mindBlocks = (mind?.entries ?? []).filter(
    (e) =>
      (e.status === "done" || e.status === "partial") &&
      (e.actualMinutes ?? 0) >= MIND_MIN_MINUTES &&
      DEEP_WORK_CATEGORIES.includes(e.category)
  );
  const mindHeld = mindBlocks.length >= 1;

  const lines: LineResult[] = [
    { key: "deficit", label: "Deficit", held: deficitHeld, detail: deficitDetail },
    { key: "protein", label: "Protein", held: proteinHeld, detail: `${protein}/${floor}g` },
    {
      key: "move",
      label: "Move",
      held: moveHeld,
      detail: workoutDone ? "trained" : walked ? "walked" : `${steps.toLocaleString()} steps`,
    },
    {
      key: "train",
      label: "Train",
      held: trainHeld,
      na: rest,
      detail: rest ? "rest day" : workoutDone ? "done" : "pending",
    },
    {
      key: "mind",
      label: "Mind",
      held: mindHeld,
      detail: mindBlocks.length ? `${mindBlocks.length} block${mindBlocks.length > 1 ? "s" : ""}` : "none",
    },
  ];

  // The body holds when you ate in deficit AND actually moved (steps goal, a
  // walk, or a logged workout). Rest days still require movement — Train is an
  // informational sub-line, never a way to "hold" with zero activity.
  const bodyHeld = deficitHeld && moveHeld;
  const held = bodyHeld && mindHeld;

  const applicable = lines.filter((l) => !l.na);
  const score = applicable.length
    ? applicable.filter((l) => l.held).length / applicable.length
    : 0;
  const hasData = mealsLogged || steps > 0 || walked || workoutDone || mindBlocks.length > 0;

  return { lines, bodyHeld, mindHeld, held, score, hasData };
}

// ============ HOLD-THE-LINE STREAK (+ freeze tokens) ============

export interface StreakState {
  /** Current consecutive held days (freezes preserve the run). */
  streak: number;
  /** Freeze tokens currently available (max 3). */
  tokens: number;
  /** Best run reached in the window. */
  longestRun: number;
  /** True when the most recent broken day was auto-protected by a token. */
  lastFrozen: boolean;
}

/** Walk the past days oldest -> newest. Holding builds the streak and earns a
 *  freeze every 7-day run; a broken day spends a freeze if one is available
 *  (the streak survives), otherwise the streak resets. Pure, no stored state. */
export function deriveStreak(pastDaysOldestFirst: { date: string; held: boolean }[]): StreakState {
  let streak = 0;
  let tokens = 0;
  let heldRun = 0;
  let longest = 0;
  let lastFrozen = false;

  for (const d of pastDaysOldestFirst) {
    if (d.held) {
      streak++;
      heldRun++;
      lastFrozen = false;
      longest = Math.max(longest, streak);
      if (heldRun % RUN_PER_TOKEN === 0 && tokens < MAX_FREEZE_TOKENS) tokens++;
    } else if (tokens > 0) {
      tokens--; // freeze the break: streak preserved, run-to-next-token resets
      heldRun = 0;
      lastFrozen = true;
    } else {
      streak = 0;
      heldRun = 0;
      lastFrozen = false;
    }
  }

  return { streak, tokens, longestRun: longest, lastFrozen };
}

export interface AdherenceSummary {
  today: LineHeld;
  streak: StreakState;
}

/** Today's line + the running streak. `logs/summaries/minds` are the recent
 *  history (any order); the window runs from the sprint anchor (or 30 days
 *  back) to yesterday, clamped to 90 days so it matches what we fetch. */
export function summariseAdherence(
  today: string,
  sprintStart: string | null | undefined,
  logs: DailyLog[],
  summaries: DailyNutritionSummary[],
  minds: MindDailyLog[],
  profile: UserProfile
): AdherenceSummary {
  const logBy = new Map(logs.map((l) => [l.date, l]));
  const sumBy = new Map(summaries.map((s) => [s.date, s]));
  const mindBy = new Map(minds.map((m) => [m.date, m]));

  const todayDate = parseISO(today);
  const todayLH = computeLineHeld(today, logBy.get(today), sumBy.get(today), mindBy.get(today), profile);

  const earliest = subDays(todayDate, 90);
  let cursor = sprintStart ? parseISO(sprintStart) : subDays(todayDate, 30);
  if (cursor < earliest) cursor = earliest;
  const yesterday = subDays(todayDate, 1);

  const past: { date: string; held: boolean }[] = [];
  while (cursor <= yesterday) {
    const d = ymd(cursor);
    const lh = computeLineHeld(d, logBy.get(d), sumBy.get(d), mindBy.get(d), profile);
    past.push({ date: d, held: lh.held });
    cursor = addDays(cursor, 1);
  }

  const base = deriveStreak(past);
  // Fold today in optimistically once its line has held.
  const streak = todayLH.held
    ? { ...base, streak: base.streak + 1, longestRun: Math.max(base.longestRun, base.streak + 1) }
    : base;

  return { today: todayLH, streak };
}

// ============ WEEKLY VERDICT ============

export interface WeeklyVerdict {
  daysHeld: number;
  totalDays: number;
  avgDeficit: number | null;
  workouts: number;
  mindHours: number;
  /** Weight change across the window (last - first logged), kg. */
  weightDelta: number | null;
  verdict: string;
  tone: "good" | "mixed" | "bad";
}

export function computeWeeklyVerdict(
  datesOldestFirst: string[],
  logs: DailyLog[],
  summaries: DailyNutritionSummary[],
  minds: MindDailyLog[],
  profile: UserProfile
): WeeklyVerdict {
  const logBy = new Map(logs.map((l) => [l.date, l]));
  const sumBy = new Map(summaries.map((s) => [s.date, s]));
  const mindBy = new Map(minds.map((m) => [m.date, m]));

  let daysHeld = 0;
  let workouts = 0;
  let mindMinutes = 0;
  const deficits: number[] = [];
  const weights: number[] = [];

  for (const d of datesOldestFirst) {
    const log = logBy.get(d);
    const sum = sumBy.get(d);
    const mind = mindBy.get(d);
    if (computeLineHeld(d, log, sum, mind, profile).held) daysHeld++;
    if ((log?.completed_exercises?.length ?? 0) > 0) workouts++;
    for (const e of mind?.entries ?? []) mindMinutes += e.actualMinutes ?? 0;
    if (sum && log && log.meals.length > 0) {
      deficits.push(sum.tdee_snapshot - log.meals.reduce((s, m) => s + m.calories, 0));
    }
    if (log?.weight_kg != null) weights.push(log.weight_kg);
  }

  const avgDeficit = deficits.length
    ? Math.round(deficits.reduce((a, b) => a + b, 0) / deficits.length)
    : null;
  const weightDelta = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null;
  const mindHours = Math.round((mindMinutes / 60) * 10) / 10;
  const totalDays = datesOldestFirst.length;

  let tone: "good" | "mixed" | "bad";
  let verdict: string;
  if (daysHeld >= 6) {
    tone = "good";
    verdict = "The line held.";
  } else if (daysHeld >= 4) {
    tone = "mixed";
    verdict = "Mostly held. Tighten the slips.";
  } else {
    tone = "bad";
    verdict = "The line broke. Reset and attack.";
  }

  return { daysHeld, totalDays, avgDeficit, workouts, mindHours, weightDelta, verdict, tone };
}
