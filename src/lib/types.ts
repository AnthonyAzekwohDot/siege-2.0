import { z } from "zod";

// ============ DAILY LOG TYPES ============

export interface DetectedFoodItem {
  name: string;
  confidence: number;
  portionUnit: string;
  portionValue: number;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  userEdited?: boolean;
}

export interface PhotoAnalysis {
  imageUri?: string;
  detectedItems: DetectedFoodItem[];
  totalCalories: number;
  estimationQualityScore: number;
  userEdits?: string[];
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  loggedAt: string;
  source?: "manual" | "photo_ai";
  photoAnalysis?: PhotoAnalysis;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

export interface DailyLog {
  id: string;
  date: string;
  steps: number;
  steps_goal: number;
  meals: Meal[];
  calories_goal: number;
  fruit_eaten: boolean;
  completed_exercises: string[];
  exercise_weights: Record<string, number>;
  morning_walk_completed: boolean;
  evening_walk_completed: boolean;
  water_bottles: number;
  water_goal: number;
  weight_kg?: number;
}

// ============ MIND TYPES ============

export type MindCategory = "drawing" | "painting" | "sculpture" | "writing" | "reading" | "admin" | "documentation";
export type BlockStatus = "pending" | "in_progress" | "done" | "partial" | "skipped";

export interface MindBlock {
  id: string;
  title: string;
  category: MindCategory;
  plannedMinutes: number;
  description?: string;
}

export interface MindLogEntry {
  id: string;
  date: string;
  blockId: string;
  blockTitle: string;
  category: MindCategory;
  plannedMinutes: number;
  actualMinutes: number;
  status: BlockStatus;
  note?: string;
  rating?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface MindDailyLog {
  id: string;
  date: string;
  entries: MindLogEntry[];
  active_block_id?: string | null;
  timer_started_at?: string | null;
  minimum_win_mode: boolean;
}

export interface MindDayPlan {
  dayOfWeek: DayOfWeek;
  blocks: MindBlock[];
}

export interface MindKPIConfig {
  deepWorkTargetHours: number;
  memoryLoopsTarget: number;
  sculptureTarget: number;
  writingPagesTarget: number;
  documentationTarget: number;
  readingDailyMinutes: number;
}

// ============ NUTRITION TYPES ============

export type ActivityLevel = "sedentary" | "light" | "moderate" | "high";
export type Sex = "male" | "female";

export interface SafeMeal {
  id: string;
  name: string;
  calories: number;
}

export interface WalkPreset {
  id: string;
  name: string;
  calories: number;
}

export interface UserProfile {
  id: string;
  weight_kg: number;
  height_cm: number;
  age: number;
  sex: Sex;
  activity_level: ActivityLevel;
  deficit_target: number;
  has_asthma: boolean;
  last_insight_date: string | null;
  weekly_insight_count: number;
  insight_week_start: string | null;
  tonight_lock_time: string;
  tonight_lock_enabled: boolean;
  last_tonight_lock_date: string | null;
  safe_meals: SafeMeal[];
  walk_presets: WalkPreset[];
  updated_at: string;
}

export interface ExertionEntry {
  id: string;
  label: string;
  calories: number;
  durationMin?: number;
  loggedAt: string;
}

export interface DailyNutritionSummary {
  id: string;
  date: string;
  tdee_snapshot: number;
  deficit_target_snapshot: number;
  exertions: ExertionEntry[];
}

// ============ WORKOUT TYPES ============

export const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  completed: boolean;
  instructions?: string;
  muscleGroups?: string[];
  diagram?: string;
  caloriesPerSet?: number;
}

export interface DaySchedule {
  day: DayOfWeek;
  focus: string;
  purpose: string;
  morningWalk: boolean;
  eveningWalk: boolean;
  exercises: Exercise[];
  isRestDay: boolean;
  isOptional: boolean;
}

// ============ VALIDATION SCHEMAS ============

export const insertMealSchema = z.object({
  name: z.string().min(1, "Meal name is required"),
  calories: z.number().min(1, "Calories must be positive").max(5000, "Calories seem too high"),
  source: z.enum(["manual", "photo_ai"]).optional(),
  proteinG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
  photoAnalysis: z.object({
    imageUri: z.string().optional(),
    detectedItems: z.array(z.object({
      name: z.string(),
      confidence: z.number().min(0).max(1),
      portionUnit: z.string(),
      portionValue: z.number(),
      calories: z.number(),
      proteinG: z.number().optional(),
      carbsG: z.number().optional(),
      fatG: z.number().optional(),
      userEdited: z.boolean().optional(),
    })),
    totalCalories: z.number(),
    estimationQualityScore: z.number().min(0).max(1),
    userEdits: z.array(z.string()).optional(),
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  }).optional(),
});

export const insertStepsSchema = z.object({
  steps: z.number().min(0).max(100000),
});

export const updateWeightSchema = z.object({
  exerciseName: z.string().min(1),
  weight: z.number().min(0).max(500),
});

export const updateWaterSchema = z.object({
  bottles: z.number().min(0).max(20),
});

export const insertExertionSchema = z.object({
  label: z.string().min(1),
  calories: z.number().min(1).max(5000),
  durationMin: z.number().min(0).optional(),
});

export const updateUserProfileSchema = z.object({
  weight_kg: z.number().min(30).max(300).optional(),
  height_cm: z.number().min(100).max(250).optional(),
  age: z.number().min(10).max(120).optional(),
  sex: z.enum(["male", "female"]).optional(),
  activity_level: z.enum(["sedentary", "light", "moderate", "high"]).optional(),
  deficit_target: z.number().min(0).max(2000).optional(),
  has_asthma: z.boolean().optional(),
  tonight_lock_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  tonight_lock_enabled: z.boolean().optional(),
  safe_meals: z.array(z.object({ id: z.string(), name: z.string(), calories: z.number() })).optional(),
  walk_presets: z.array(z.object({ id: z.string(), name: z.string(), calories: z.number() })).optional(),
});

export type InsertMeal = z.infer<typeof insertMealSchema>;
export type InsertExertion = z.infer<typeof insertExertionSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
