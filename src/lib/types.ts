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

/** One logged working set. load=null means bodyweight; reps=null means not yet entered. */
export interface SetEntry {
  set: number; // 1-based index within the exercise
  load: number | null; // kg, or null for bodyweight
  reps: number | null; // reps achieved (captures AMRAP counts too)
  rpe?: number;
  done: boolean;
  ts: string; // ISO timestamp of last edit
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
  /** Legacy single-weight store. Backward-read only; superseded by exercise_logs. */
  exercise_weights: Record<string, number>;
  /** Per-exercise set log (the progressive-overload record). Requires the
   *  exercise_logs JSONB column (see supabase/migrations). */
  exercise_logs?: Record<string, SetEntry[]>;
  morning_walk_completed: boolean;
  evening_walk_completed: boolean;
  water_bottles: number;
  water_goal: number;
  weight_kg?: number;
}

// ============ MIND TYPES ============

export type MindCategory = "drawing" | "painting" | "sculpture" | "writing" | "reading" | "admin" | "documentation" | "master-study" | "experimentation";
export type BlockStatus = "pending" | "in_progress" | "done" | "partial" | "skipped";
export type StretchLevel = "comfort" | "stretch" | "breakthrough";

/** The specific fundamentals Anthony is drilling to reach 0.1% mastery */
export type Fundamental =
  | "proportion-placement" | "form-construction" | "perspective"
  | "anatomy" | "gesture" | "composition"
  | "values" | "colour-theory";

/** Drawing skills */
export const DRAWING_FUNDAMENTALS: Fundamental[] = [
  "proportion-placement", "form-construction", "perspective",
  "anatomy", "gesture", "composition",
];

/** Painting skills */
export const PAINTING_FUNDAMENTALS: Fundamental[] = [
  "values", "colour-theory",
];

export const FUNDAMENTALS: Fundamental[] = [
  ...DRAWING_FUNDAMENTALS, ...PAINTING_FUNDAMENTALS,
];

export const FUNDAMENTAL_LABELS: Record<Fundamental, string> = {
  "proportion-placement": "Proportion & Placement",
  "form-construction": "Form & Construction",
  "perspective": "Perspective",
  "anatomy": "Anatomy",
  "gesture": "Gesture",
  "composition": "Composition",
  "values": "Values",
  "colour-theory": "Colour Theory",
};

export interface MindBlock {
  id: string;
  title: string;
  category: MindCategory;
  plannedMinutes: number;
  description?: string;
  /** Which fundamentals this block can target */
  focusOptions?: Fundamental[];
  /** If true, only shows on the first week of each month */
  monthlyOnly?: boolean;
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
  /** Which fundamentals were practiced this session */
  fundamentals?: Fundamental[];
  /** Did you push past comfort or play it safe? */
  stretchLevel?: StretchLevel;
  /** If master study, who/what was studied */
  masterReference?: string;
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
  /** Day-0 of the 90-day sprint (yyyy-MM-dd). Anchors training phase/week. */
  sprint_start_date?: string | null;
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
  /** Working rep range for double progression: [min, max]. */
  repRange?: [number, number];
  /** How to run it with fixed 15kg dumbbells at home when load tops out. */
  homeAlt?: string;
  /** Bodyweight / AMRAP move: load is not tracked, reps are the PR. */
  isBodyweight?: boolean;
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

// ============ TRAINING PHASE (90-day periodisation) ============

export type TrainingPhase = "base" | "build" | "deload" | "peak";

export interface PhaseInfo {
  /** 1-based week of the sprint (clamped 1..13). */
  week: number;
  /** 1-based day of the sprint. */
  day: number;
  phase: TrainingPhase;
  /** Display label, e.g. "Build · Week 6". */
  label: string;
  /** Multiply prescribed sets by this (0.5 on deload weeks). */
  setMultiplier: number;
  isDeload: boolean;
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
  sprint_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export type InsertMeal = z.infer<typeof insertMealSchema>;
export type InsertExertion = z.infer<typeof insertExertionSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
