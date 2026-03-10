import { supabase } from "@/lib/supabase";
import { calculateBMR, calculateTDEE, WALK_CALORIES, CALORIES_PER_STEP } from "@/lib/calculations";

/** Format a Date as yyyy-MM-dd in LOCAL time (not UTC). */
function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

import type {
  DailyLog,
  MindDailyLog,
  MindLogEntry,
  UserProfile,
  DailyNutritionSummary,
  InsertMeal,
  InsertExertion,
  UpdateUserProfile,
  ExertionEntry,
  Meal,
} from "@/lib/types";

// ============ DAILY LOGS ============

export async function getOrCreateDailyLog(date: string): Promise<DailyLog> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  if (error) throw error;

  if (data) return data as DailyLog;

  const newLog: DailyLog = {
    id: crypto.randomUUID(),
    date,
    steps: 0,
    steps_goal: 15000,
    meals: [],
    calories_goal: 2400,
    fruit_eaten: false,
    completed_exercises: [],
    exercise_weights: {},
    morning_walk_completed: false,
    evening_walk_completed: false,
    water_bottles: 0,
    water_goal: 7,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("daily_logs")
    .insert(newLog)
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted as DailyLog;
}

// Fetch current log (row must already exist from page load's getOrCreate)
async function fetchDailyLog(date: string): Promise<DailyLog> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("date", date)
    .single();

  if (error) throw error;
  return data as DailyLog;
}

export async function getAllLogs(): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .order("date", { ascending: false })
    .limit(365);

  if (error) throw error;
  return (data ?? []) as DailyLog[];
}

export async function updateSteps(date: string, steps: number): Promise<DailyLog> {
  const { data, error } = await supabase
    .from("daily_logs")
    .update({ steps })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;

  await syncStepsExertion(date, steps);

  return data as DailyLog;
}

export async function addMeal(date: string, meal: InsertMeal): Promise<DailyLog> {
  const log = await fetchDailyLog(date);

  const newMeal: Meal = {
    id: crypto.randomUUID(),
    name: meal.name,
    calories: meal.calories,
    loggedAt: new Date().toISOString(),
    source: meal.source,
    proteinG: meal.proteinG,
    carbsG: meal.carbsG,
    fatG: meal.fatG,
    photoAnalysis: meal.photoAnalysis,
  };

  const updatedMeals = [...log.meals, newMeal];

  const { data, error } = await supabase
    .from("daily_logs")
    .update({ meals: updatedMeals })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as DailyLog;
}

export async function deleteMeal(date: string, mealId: string): Promise<DailyLog> {
  const log = await fetchDailyLog(date);

  const updatedMeals = log.meals.filter((m) => m.id !== mealId);

  const { data, error } = await supabase
    .from("daily_logs")
    .update({ meals: updatedMeals })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as DailyLog;
}

export async function toggleExercise(date: string, exerciseName: string): Promise<DailyLog> {
  const log = await fetchDailyLog(date);

  const isCompleted = log.completed_exercises.includes(exerciseName);
  const updatedExercises = isCompleted
    ? log.completed_exercises.filter((e) => e !== exerciseName)
    : [...log.completed_exercises, exerciseName];

  const { data, error } = await supabase
    .from("daily_logs")
    .update({ completed_exercises: updatedExercises })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;

  const caloriesPerExercise = 50;
  await syncWorkoutExertion(date, exerciseName, caloriesPerExercise, !isCompleted);

  return data as DailyLog;
}

export async function toggleMorningWalk(date: string): Promise<DailyLog> {
  const log = await fetchDailyLog(date);
  const newValue = !log.morning_walk_completed;

  const { data, error } = await supabase
    .from("daily_logs")
    .update({ morning_walk_completed: newValue })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;

  await syncWorkoutExertion(date, "Morning Walk", WALK_CALORIES.morningWalk, newValue);

  return data as DailyLog;
}

export async function toggleEveningWalk(date: string): Promise<DailyLog> {
  const log = await fetchDailyLog(date);
  const newValue = !log.evening_walk_completed;

  const { data, error } = await supabase
    .from("daily_logs")
    .update({ evening_walk_completed: newValue })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;

  await syncWorkoutExertion(date, "Evening Walk", WALK_CALORIES.eveningWalk, newValue);

  return data as DailyLog;
}

export async function toggleFruit(date: string): Promise<DailyLog> {
  const log = await fetchDailyLog(date);

  const { data, error } = await supabase
    .from("daily_logs")
    .update({ fruit_eaten: !log.fruit_eaten })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as DailyLog;
}

export async function updateExerciseWeight(date: string, exerciseName: string, weight: number): Promise<DailyLog> {
  const log = await fetchDailyLog(date);

  const updatedWeights = { ...log.exercise_weights, [exerciseName]: weight };

  const { data, error } = await supabase
    .from("daily_logs")
    .update({ exercise_weights: updatedWeights })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as DailyLog;
}

export async function updateWater(date: string, bottles: number): Promise<DailyLog> {
  const { data, error } = await supabase
    .from("daily_logs")
    .update({ water_bottles: bottles })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as DailyLog;
}

// ============ MIND LOGS ============

export async function getOrCreateMindLog(date: string): Promise<MindDailyLog> {
  const { data, error } = await supabase
    .from("mind_logs")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  if (error) throw error;

  if (data) return data as MindDailyLog;

  const newLog: MindDailyLog = {
    id: crypto.randomUUID(),
    date,
    entries: [],
    active_block_id: null,
    timer_started_at: null,
    minimum_win_mode: false,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("mind_logs")
    .insert(newLog)
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted as MindDailyLog;
}

async function fetchMindLog(date: string): Promise<MindDailyLog> {
  const { data, error } = await supabase
    .from("mind_logs")
    .select("*")
    .eq("date", date)
    .single();

  if (error) throw error;
  return data as MindDailyLog;
}

export async function getAllMindLogs(): Promise<MindDailyLog[]> {
  const { data, error } = await supabase
    .from("mind_logs")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MindDailyLog[];
}

export async function addMindEntry(date: string, entry: { blockId: string; blockTitle: string; category: string; plannedMinutes: number; description?: string }): Promise<MindDailyLog> {
  const log = await fetchMindLog(date);

  const newEntry: MindLogEntry = {
    id: crypto.randomUUID(),
    date,
    blockId: entry.blockId,
    blockTitle: entry.blockTitle,
    category: entry.category as MindLogEntry["category"],
    plannedMinutes: entry.plannedMinutes,
    actualMinutes: 0,
    status: "pending",
    completedAt: undefined,
  };

  const updatedEntries = [...log.entries, newEntry];

  const { data, error } = await supabase
    .from("mind_logs")
    .update({ entries: updatedEntries })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as MindDailyLog;
}

export async function updateMindEntry(date: string, entryId: string, update: Partial<MindLogEntry>): Promise<MindDailyLog> {
  const log = await fetchMindLog(date);

  const updatedEntries = log.entries.map((e) =>
    e.id === entryId ? { ...e, ...update } : e
  );

  const { data, error } = await supabase
    .from("mind_logs")
    .update({ entries: updatedEntries })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as MindDailyLog;
}

export async function startMindTimer(date: string, blockId: string): Promise<MindDailyLog> {
  const { data, error } = await supabase
    .from("mind_logs")
    .update({
      active_block_id: blockId,
      timer_started_at: new Date().toISOString(),
    })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as MindDailyLog;
}

export async function stopMindTimer(date: string): Promise<MindDailyLog> {
  const { data, error } = await supabase
    .from("mind_logs")
    .update({
      active_block_id: null,
      timer_started_at: null,
    })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as MindDailyLog;
}

export async function toggleMinimumWinMode(date: string): Promise<MindDailyLog> {
  const log = await fetchMindLog(date);

  const { data, error } = await supabase
    .from("mind_logs")
    .update({ minimum_win_mode: !log.minimum_win_mode })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as MindDailyLog;
}

// ============ USER PROFILE ============

export async function getUserProfile(): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", "default-user")
    .maybeSingle();

  if (error) throw error;

  if (data) return data as UserProfile;

  const defaultProfile: UserProfile = {
    id: "default-user",
    weight_kg: 151,
    height_cm: 183,
    age: 25,
    sex: "male",
    activity_level: "light",
    deficit_target: 1500,
    has_asthma: false,
    last_insight_date: null,
    weekly_insight_count: 0,
    insight_week_start: null,
    tonight_lock_time: "20:00",
    tonight_lock_enabled: true,
    last_tonight_lock_date: null,
    safe_meals: [],
    walk_presets: [],
    updated_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertError } = await supabase
    .from("user_profiles")
    .insert(defaultProfile)
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted as UserProfile;
}

export async function updateUserProfile(update: UpdateUserProfile): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", "default-user")
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
}

// ============ NUTRITION ============

export async function getOrCreateNutritionSummary(date: string): Promise<DailyNutritionSummary> {
  const { data, error } = await supabase
    .from("daily_nutrition_summaries")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  if (error) throw error;

  if (data) return data as DailyNutritionSummary;

  const profile = await getUserProfile();
  const bmr = calculateBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex);
  const tdee = calculateTDEE(bmr, profile.activity_level);

  const newSummary: DailyNutritionSummary = {
    id: crypto.randomUUID(),
    date,
    tdee_snapshot: tdee,
    deficit_target_snapshot: profile.deficit_target,
    exertions: [],
  };

  const { data: inserted, error: insertError } = await supabase
    .from("daily_nutrition_summaries")
    .insert(newSummary)
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted as DailyNutritionSummary;
}

async function fetchNutritionSummary(date: string): Promise<DailyNutritionSummary> {
  const { data, error } = await supabase
    .from("daily_nutrition_summaries")
    .select("*")
    .eq("date", date)
    .single();

  if (error) throw error;
  return data as DailyNutritionSummary;
}

export async function getNutritionSummaries(days: number): Promise<DailyNutritionSummary[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = localDateStr(startDate);

  const { data, error } = await supabase
    .from("daily_nutrition_summaries")
    .select("*")
    .gte("date", startDateStr)
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DailyNutritionSummary[];
}

export async function addExertion(date: string, exertion: InsertExertion): Promise<DailyNutritionSummary> {
  const summary = await fetchNutritionSummary(date);

  const newExertion: ExertionEntry = {
    id: crypto.randomUUID(),
    label: exertion.label,
    calories: exertion.calories,
    durationMin: exertion.durationMin,
    loggedAt: new Date().toISOString(),
  };

  const updatedExertions = [...summary.exertions, newExertion];

  const { data, error } = await supabase
    .from("daily_nutrition_summaries")
    .update({ exertions: updatedExertions })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as DailyNutritionSummary;
}

export async function updateExertion(date: string, exertionId: string, exertion: InsertExertion): Promise<DailyNutritionSummary> {
  const summary = await fetchNutritionSummary(date);

  const updatedExertions = summary.exertions.map((e) =>
    e.id === exertionId
      ? { ...e, label: exertion.label, calories: exertion.calories, durationMin: exertion.durationMin }
      : e
  );

  const { data, error } = await supabase
    .from("daily_nutrition_summaries")
    .update({ exertions: updatedExertions })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as DailyNutritionSummary;
}

export async function deleteExertion(date: string, exertionId: string): Promise<DailyNutritionSummary> {
  const summary = await fetchNutritionSummary(date);

  const updatedExertions = summary.exertions.filter((e) => e.id !== exertionId);

  const { data, error } = await supabase
    .from("daily_nutrition_summaries")
    .update({ exertions: updatedExertions })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as DailyNutritionSummary;
}

export async function syncWorkoutExertion(date: string, label: string, calories: number, isCompleted: boolean): Promise<void> {
  // Ensure nutrition summary exists (may not if this is the first exertion of the day)
  const summary = await getOrCreateNutritionSummary(date);

  const existingIndex = summary.exertions.findIndex((e) => e.label === label);

  let updatedExertions: ExertionEntry[];

  if (isCompleted) {
    if (existingIndex >= 0) {
      updatedExertions = summary.exertions.map((e) =>
        e.label === label ? { ...e, calories } : e
      );
    } else {
      updatedExertions = [
        ...summary.exertions,
        {
          id: crypto.randomUUID(),
          label,
          calories,
          loggedAt: new Date().toISOString(),
        },
      ];
    }
  } else {
    updatedExertions = summary.exertions.filter((e) => e.label !== label);
  }

  const { error } = await supabase
    .from("daily_nutrition_summaries")
    .update({ exertions: updatedExertions })
    .eq("date", date);

  if (error) throw error;
}

export async function syncStepsExertion(date: string, steps: number): Promise<void> {
  const calories = Math.round(steps * CALORIES_PER_STEP);
  const label = "Steps";

  // Ensure nutrition summary exists
  const summary = await getOrCreateNutritionSummary(date);

  const existingIndex = summary.exertions.findIndex((e) => e.label === label);

  let updatedExertions: ExertionEntry[];

  if (calories > 0) {
    if (existingIndex >= 0) {
      updatedExertions = summary.exertions.map((e) =>
        e.label === label ? { ...e, calories } : e
      );
    } else {
      updatedExertions = [
        ...summary.exertions,
        {
          id: crypto.randomUUID(),
          label,
          calories,
          loggedAt: new Date().toISOString(),
        },
      ];
    }
  } else {
    updatedExertions = summary.exertions.filter((e) => e.label !== label);
  }

  const { error } = await supabase
    .from("daily_nutrition_summaries")
    .update({ exertions: updatedExertions })
    .eq("date", date);

  if (error) throw error;
}

// ============ WEIGHT TRACKING ============

export async function logWeight(date: string, weightKg: number): Promise<DailyLog> {
  const { data, error } = await supabase
    .from("daily_logs")
    .update({ weight_kg: weightKg })
    .eq("date", date)
    .select()
    .single();

  if (error) throw error;
  return data as DailyLog;
}

export async function getWeightHistory(days: number): Promise<{ date: string; weight_kg: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = localDateStr(startDate);

  const { data, error } = await supabase
    .from("daily_logs")
    .select("date, weight_kg")
    .gte("date", startDateStr)
    .not("weight_kg", "is", null)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as { date: string; weight_kg: number }[];
}

export async function getDailyLogsHistory(days: number): Promise<DailyLog[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = localDateStr(startDate);

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .gte("date", startDateStr)
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DailyLog[];
}

// ============ INSIGHTS ============

function getWeekStart(dateStr: string): string {
  // Parse as local date (append T12:00 to avoid UTC midnight edge cases)
  const date = new Date(dateStr + "T12:00:00");
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return localDateStr(date);
}

async function shouldShowInsight(profile: UserProfile, today: string): Promise<boolean> {
  if (profile.last_insight_date === today) return false;

  const currentWeekStart = getWeekStart(today);

  if (profile.insight_week_start !== currentWeekStart) {
    return Math.random() < 0.4;
  }

  if (profile.weekly_insight_count >= 4) return false;

  return Math.random() < 0.4;
}

// Generate insight text only — NO side effects. Call markInsightShown separately.
export async function generateInsight(today: string): Promise<{ message: string; action: string; actionLabel: string } | null> {
  const profile = await getUserProfile();

  const canShow = await shouldShowInsight(profile, today);
  if (!canShow) return null;

  const logs = await getDailyLogsHistory(14);

  if (logs.length < 3) return null;

  const walkDayLogs = logs.filter((l) => l.morning_walk_completed || l.evening_walk_completed);
  const noWalkDayLogs = logs.filter((l) => !l.morning_walk_completed && !l.evening_walk_completed);

  const avgCaloriesWalkDays = walkDayLogs.length > 0
    ? Math.round(walkDayLogs.reduce((sum, l) => sum + l.meals.reduce((s, m) => s + m.calories, 0), 0) / walkDayLogs.length)
    : 0;
  const avgCaloriesNoWalkDays = noWalkDayLogs.length > 0
    ? Math.round(noWalkDayLogs.reduce((sum, l) => sum + l.meals.reduce((s, m) => s + m.calories, 0), 0) / noWalkDayLogs.length)
    : 0;

  const eveningOvereatingDays = logs.filter((l) => {
    const eveningMeals = l.meals.filter((m) => {
      const hour = new Date(m.loggedAt).getHours();
      return hour >= 20;
    });
    const eveningCalories = eveningMeals.reduce((s, m) => s + m.calories, 0);
    return eveningCalories > 200;
  });

  const daysHitting10k = logs.filter((l) => l.steps >= 10000);
  const stepConsistency = logs.length > 0 ? daysHitting10k.length / logs.length : 0;

  const mealTimeCalories: Record<string, { total: number; count: number }> = {};
  for (const log of logs) {
    for (const meal of log.meals) {
      const hour = new Date(meal.loggedAt).getHours();
      const timeSlot = `${hour}:00`;
      if (!mealTimeCalories[timeSlot]) {
        mealTimeCalories[timeSlot] = { total: 0, count: 0 };
      }
      mealTimeCalories[timeSlot].total += meal.calories;
      mealTimeCalories[timeSlot].count += 1;
    }
  }

  let highestCalorieTime = "";
  let highestAvgCalories = 0;
  for (const [time, data] of Object.entries(mealTimeCalories)) {
    const avg = data.total / data.count;
    if (avg > highestAvgCalories) {
      highestAvgCalories = avg;
      highestCalorieTime = time;
    }
  }

  const insights: { message: string; action: string; actionLabel: string }[] = [];

  if (walkDayLogs.length > 0 && noWalkDayLogs.length > 0 && avgCaloriesWalkDays > avgCaloriesNoWalkDays + 200) {
    insights.push({
      message: `On walk days, you eat ~${avgCaloriesWalkDays - avgCaloriesNoWalkDays} more calories than rest days. The walks help, but watch the compensation eating.`,
      action: "view-nutrition",
      actionLabel: "View Nutrition",
    });
  }

  if (eveningOvereatingDays.length > logs.length * 0.4) {
    insights.push({
      message: `You ate more than 200 calories after 8 PM on ${eveningOvereatingDays.length} of the last ${logs.length} days. Late eating is your biggest leak.`,
      action: "tonight-lock",
      actionLabel: "Set Tonight Lock",
    });
  }

  if (highestCalorieTime) {
    insights.push({
      message: `Your highest calorie meals tend to happen around ${highestCalorieTime}. Plan your heaviest meal for when you're most disciplined instead.`,
      action: "view-meals",
      actionLabel: "View Meals",
    });
  }

  if (stepConsistency < 0.5) {
    insights.push({
      message: `Only ${Math.round(stepConsistency * 100)}% of the last ${logs.length} days hit 10K steps. Consistency matters more than big days.`,
      action: "view-steps",
      actionLabel: "View Steps",
    });
  }

  if (insights.length === 0) return null;

  return insights[Math.floor(Math.random() * insights.length)];
}

// Separate mutation to mark insight as shown — called from the UI, not from the query
export async function markInsightShown(today: string): Promise<void> {
  const profile = await getUserProfile();
  const currentWeekStart = getWeekStart(today);

  const update: Record<string, unknown> = {
    last_insight_date: today,
    weekly_insight_count: (profile.weekly_insight_count || 0) + 1,
    updated_at: new Date().toISOString(),
  };

  if (profile.insight_week_start !== currentWeekStart) {
    update.weekly_insight_count = 1;
    update.insight_week_start = currentWeekStart;
  }

  await supabase
    .from("user_profiles")
    .update(update)
    .eq("id", "default-user");
}

export async function dismissInsight(today: string): Promise<void> {
  const { error } = await supabase
    .from("user_profiles")
    .update({
      last_insight_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default-user");

  if (error) throw error;
}

// ============ TONIGHT LOCK ============

export async function getTonightLockStatus(today: string): Promise<{
  shouldShow: boolean;
  remainingCalories: number;
  deficitStatus: string;
  isOnTrack: boolean;
}> {
  const profile = await getUserProfile();

  if (!profile.tonight_lock_enabled) {
    return { shouldShow: false, remainingCalories: 0, deficitStatus: "disabled", isOnTrack: true };
  }

  const now = new Date();
  const [lockHour, lockMinute] = profile.tonight_lock_time.split(":").map(Number);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const isPastLockTime = currentHour > lockHour || (currentHour === lockHour && currentMinute >= lockMinute);
  const alreadyShownToday = profile.last_tonight_lock_date === today;

  const shouldShow = isPastLockTime && !alreadyShownToday;

  const log = await getOrCreateDailyLog(today);
  const summary = await getOrCreateNutritionSummary(today);

  const totalCaloriesEaten = log.meals.reduce((sum, m) => sum + m.calories, 0);
  const totalExertion = summary.exertions.reduce((sum, e) => sum + e.calories, 0);
  const budget = summary.tdee_snapshot - summary.deficit_target_snapshot + totalExertion;
  const remainingCalories = budget - totalCaloriesEaten;

  const netDeficit = (summary.tdee_snapshot + totalExertion) - totalCaloriesEaten;
  const isOnTrack = netDeficit >= summary.deficit_target_snapshot;

  let deficitStatus: string;
  if (isOnTrack) {
    deficitStatus = `On track. ${Math.round(netDeficit)} cal deficit (target: ${summary.deficit_target_snapshot}).`;
  } else {
    deficitStatus = `Off track. ${Math.round(netDeficit)} cal deficit (target: ${summary.deficit_target_snapshot}).`;
  }

  return { shouldShow, remainingCalories, deficitStatus, isOnTrack };
}

export async function markTonightLockShown(today: string): Promise<void> {
  const { error } = await supabase
    .from("user_profiles")
    .update({
      last_tonight_lock_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default-user");

  if (error) throw error;
}

export async function logSafeMeal(date: string, name: string, calories: number): Promise<DailyLog> {
  return addMeal(date, { name, calories, source: "manual" });
}

export async function logWalkPreset(date: string, name: string, calories: number): Promise<void> {
  await addExertion(date, { label: name, calories });
}
