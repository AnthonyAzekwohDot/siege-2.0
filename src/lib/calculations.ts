import type { ActivityLevel, Sex } from "./types";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

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

export function calculateDailyBudget(tdee: number, deficitTarget: number, exertedCalories: number): number {
  return tdee - deficitTarget + exertedCalories;
}

export function calculateNetDeficit(tdee: number, exertedCalories: number, eatenCalories: number): number {
  return (tdee + exertedCalories) - eatenCalories;
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
