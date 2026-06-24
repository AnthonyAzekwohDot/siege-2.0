import type { ActivityLevel, Sex } from "./types";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

// Movement estimates kept ONLY as a display/record of activity.
// They are NOT added to the eating budget or the deficit: the activity
// multiplier above already prices daily walking into TDEE. Eating these
// back double-counts them and quietly erases the deficit.
export const WALK_CALORIES = {
  morningWalk: 400,
  eveningWalk: 150,
};

export const CALORIES_PER_STEP = 0.04;
export const MINIMUM_CALORIE_BUDGET = 1200;

export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? baseBMR + 5 : baseBMR - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Daily eating budget = maintenance (TDEE) minus the target deficit.
 * Activity is ALREADY inside TDEE via the activity multiplier, so exercise,
 * walks and steps are deliberately NOT added back here. Floored at a safe
 * minimum so the budget can never collapse to nothing.
 */
export function calculateDailyBudget(tdee: number, deficitTarget: number): number {
  return Math.max(MINIMUM_CALORIE_BUDGET, tdee - deficitTarget);
}

/**
 * The actual deficit achieved today = maintenance minus what was eaten.
 * Exertion is intentionally excluded (already in TDEE).
 */
export function calculateNetDeficit(tdee: number, eatenCalories: number): number {
  return tdee - eatenCalories;
}

export function isOnTrack(netDeficit: number, deficitTarget: number): boolean {
  return netDeficit >= deficitTarget;
}

export function getExerciseCalories(exerciseName: string, schedule: { exercises: { name: string; caloriesPerSet?: number; sets: number }[] }[]): number {
  for (const day of schedule) {
    const exercise = day.exercises.find(e => e.name === exerciseName);
    if (exercise) {
      return (exercise.caloriesPerSet || 10) * exercise.sets;
    }
  }
  return 50;
}

export function getMealTypeFromTime(): "breakfast" | "lunch" | "dinner" | "snack" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 18) return "snack";
  return "dinner";
}

// ============ WEIGHT TREND (drives adaptive TDEE + the Day-90 projection) ============

/**
 * Exponential moving average of body weight, oldest -> newest. Smooths the
 * daily water-weight noise so TDEE and the fat-loss projection track the real
 * trend instead of a single spike. Returns null when there are no readings.
 */
export function calculateWeightEMA(weightsOldestFirst: number[], alpha = 0.25): number | null {
  const clean = weightsOldestFirst.filter((w) => typeof w === "number" && !Number.isNaN(w));
  if (clean.length === 0) return null;
  let ema = clean[0];
  for (let i = 1; i < clean.length; i++) {
    ema = alpha * clean[i] + (1 - alpha) * ema;
  }
  return ema;
}

/**
 * Least-squares slope of value-vs-day (units per day; negative = falling).
 * Needs at least two points spread across at least two distinct days, else null.
 */
export function linearRatePerDay(points: { day: number; value: number }[]): number | null {
  const pts = points.filter((p) => Number.isFinite(p.day) && Number.isFinite(p.value));
  if (pts.length < 2) return null;
  const n = pts.length;
  const sumX = pts.reduce((s, p) => s + p.day, 0);
  const sumY = pts.reduce((s, p) => s + p.value, 0);
  const sumXY = pts.reduce((s, p) => s + p.day * p.value, 0);
  const sumXX = pts.reduce((s, p) => s + p.day * p.day, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null; // all readings on the same day
  return (n * sumXY - sumX * sumY) / denom;
}
