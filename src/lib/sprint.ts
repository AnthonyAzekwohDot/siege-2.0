import { differenceInCalendarDays, parseISO } from "date-fns";
import { calculateWeightEMA, linearRatePerDay } from "@/lib/calculations";

// ============ THE 90-DAY SPRINT ============
// The sprint is the spine of the app: a fixed 90-day window anchored to
// sprint_start_date. getTrainingPhase (constants.ts) maps it to 13 training
// weeks; this module owns the day counter, the fat-loss projection and the
// protein floor so the body half of the sprint is measured, not vibed.

export const SPRINT_DAYS = 90;

export interface SprintProgress {
  /** True once a start date is anchored. */
  active: boolean;
  /** 1-based day of the sprint, clamped to 1..90 for display. */
  day: number;
  /** Uncapped day number. <1 means the anchor is in the future; >90 means done. */
  dayRaw: number;
  totalDays: number;
  /** 0..1 across the sprint. */
  pct: number;
  /** Whole days remaining to Day 90 (0 once complete). */
  daysLeft: number;
  /** True after Day 90. */
  isComplete: boolean;
  /** True when the anchor is set for a future date. */
  notStarted: boolean;
}

export function getSprintProgress(
  startDate: string | null | undefined,
  today: string
): SprintProgress {
  if (!startDate) {
    return {
      active: false, day: 0, dayRaw: 0, totalDays: SPRINT_DAYS,
      pct: 0, daysLeft: SPRINT_DAYS, isComplete: false, notStarted: false,
    };
  }
  const idx = differenceInCalendarDays(parseISO(today), parseISO(startDate)); // 0-based
  const dayRaw = idx + 1;
  const day = Math.min(SPRINT_DAYS, Math.max(1, dayRaw));
  const pct = Math.max(0, Math.min(1, dayRaw / SPRINT_DAYS));
  const daysLeft = Math.max(0, SPRINT_DAYS - dayRaw + 1); // includes the current day: Day 90 → 1 left, done → 0
  return {
    active: true, day, dayRaw, totalDays: SPRINT_DAYS,
    pct, daysLeft, isComplete: dayRaw > SPRINT_DAYS, notStarted: dayRaw < 1,
  };
}

// ============ FAT-LOSS PROJECTION ============

export interface WeightProjection {
  /** Enough data to say anything at all (>=1 reading). */
  hasData: boolean;
  /** Smoothed current weight (EMA), or null. */
  emaNow: number | null;
  /** Trend rate in kg/week (negative = losing). Null until >=2 readings. */
  ratePerWeek: number | null;
  /** Where the trend lands you on Day 90 (needs a sprint anchor + a rate). */
  projectedDay90: number | null;
  goal: number | null;
  /** For a cut, true when the projection meets or beats the goal. */
  onPace: boolean | null;
  /** projectedDay90 - goal (negative = ahead of goal). */
  gapToGoal: number | null;
}

const EMPTY_PROJECTION: WeightProjection = {
  hasData: false, emaNow: null, ratePerWeek: null,
  projectedDay90: null, goal: null, onPace: null, gapToGoal: null,
};

/**
 * Project the fat-loss trend forward to Day 90.
 * @param history logged weights, ascending by date ([{date, weight_kg}]).
 * @param startDate sprint anchor (origin of the day axis; falls back to the
 *        first reading's date for the rate when there is no anchor).
 */
export function projectFatLoss(
  history: { date: string; weight_kg: number }[],
  startDate: string | null | undefined,
  today: string,
  goal: number | null
): WeightProjection {
  const clean = history.filter(
    (h) => typeof h.weight_kg === "number" && !Number.isNaN(h.weight_kg) && h.date <= today
  );
  if (clean.length === 0) return { ...EMPTY_PROJECTION, goal };

  const emaNow = calculateWeightEMA(clean.map((h) => h.weight_kg));

  const origin = startDate ?? clean[0].date;
  const points = clean.map((h) => ({
    day: differenceInCalendarDays(parseISO(h.date), parseISO(origin)),
    value: h.weight_kg,
  }));
  const ratePerDay = linearRatePerDay(points);

  // Only project while the sprint is genuinely in flight (Day 1..90). Before it
  // starts (dayRaw < 1) or after it ends (dayRaw > 90) the extrapolation is junk.
  const sp = getSprintProgress(startDate, today);
  const inWindow = sp.active && sp.dayRaw >= 1 && sp.dayRaw <= SPRINT_DAYS;
  const projectedDay90 =
    emaNow != null && ratePerDay != null && inWindow
      ? emaNow + ratePerDay * (SPRINT_DAYS - sp.dayRaw)
      : null;

  const gapToGoal = projectedDay90 != null && goal != null ? projectedDay90 - goal : null;

  return {
    hasData: true,
    emaNow,
    ratePerWeek: ratePerDay != null ? ratePerDay * 7 : null,
    projectedDay90,
    goal,
    onPace: gapToGoal != null ? gapToGoal <= 0 : null,
    gapToGoal,
  };
}

// ============ PROTEIN FLOOR ============

/** Suggested daily protein floor (g) when the user has not set one. */
export function defaultProteinFloor(
  goalWeightKg: number | null | undefined,
  currentWeightKg: number
): number {
  const base = goalWeightKg ?? currentWeightKg;
  // ~1.8 g/kg of goal bodyweight: high enough to hold muscle through a cut.
  return Math.round(base * 1.8);
}

/** Total protein logged across the day's meals (g). */
export function totalProtein(meals: { proteinG?: number }[]): number {
  return Math.round(meals.reduce((s, m) => s + (m.proteinG ?? 0), 0));
}
