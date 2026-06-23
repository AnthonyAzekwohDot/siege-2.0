"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import * as queries from "@/lib/queries";
import { calculateDailyBudget } from "@/lib/calculations";
import { WORKOUT_SCHEDULE, getTrainingPhase } from "@/lib/constants";
import { getSprintProgress, projectFatLoss, defaultProteinFloor, totalProtein } from "@/lib/sprint";
import { summariseAdherence } from "@/lib/adherence";
import type { DailyLog, DayOfWeek, InsertMeal, PhotoAnalysis } from "@/lib/types";

import { StepRing } from "@/components/dashboard/step-ring";
import { CalorieBar } from "@/components/dashboard/calorie-bar";
import { WorkoutCard } from "@/components/dashboard/workout-card";
import { MealForm } from "@/components/dashboard/meal-form";
import { FoodSearch } from "@/components/dashboard/food-search";
import { StepInput } from "@/components/dashboard/step-input";
import { LineHeldCard } from "@/components/sprint/line-held-card";
import { InsightCard } from "@/components/dashboard/insight-card";
import { TonightLock } from "@/components/dashboard/tonight-lock";
import { FoodCamera } from "@/components/dashboard/food-camera";
import { FoodReviewSheet } from "@/components/dashboard/food-review-sheet";
import { WaterTracker } from "@/components/dashboard/water-tracker";
import { SprintHeader } from "@/components/sprint/sprint-header";
import { ProteinBar } from "@/components/sprint/protein-bar";

// ============================================================
// Dashboard — The main hub
// ============================================================

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [today] = useState(() => new Date());
  const dateKey = format(today, "yyyy-MM-dd");
  const dayName = format(today, "EEEE");
  const fullDate = format(today, "MMMM d, yyyy");

  // ---------- Local UI state ----------
  const [cameraOpen, setCameraOpen] = useState(false);
  const [reviewData, setReviewData] = useState<PhotoAnalysis | null>(null);
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [foodSearchOpen, setFoodSearchOpen] = useState(false);
  const [stepInputOpen, setStepInputOpen] = useState(false);

  // ---------- Queries ----------
  const {
    data: dailyLog,
    isLoading: logLoading,
  } = useQuery({
    queryKey: ["daily-log", dateKey],
    queryFn: () => queries.getOrCreateDailyLog(dateKey),
  });

  const { data: insight } = useQuery({
    queryKey: ["insight", dateKey],
    queryFn: async () => {
      const result = await queries.generateInsight(dateKey);
      if (result) await queries.markInsightShown(dateKey);
      return result;
    },
    staleTime: 30 * 60 * 1000,
  });

  const { data: tonightLock } = useQuery({
    queryKey: ["tonight-lock", dateKey],
    queryFn: () => queries.getTonightLockStatus(dateKey),
    refetchInterval: 60 * 1000,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => queries.getUserProfile(),
  });

  const { data: nutritionSummary } = useQuery({
    queryKey: ["nutrition-summary", dateKey],
    queryFn: () => queries.getOrCreateNutritionSummary(dateKey),
  });

  const { data: weightHistory } = useQuery({
    queryKey: ["weight-history", 90],
    queryFn: () => queries.getWeightHistory(90),
  });

  const { data: logsHistory } = useQuery({
    queryKey: ["daily-logs-history", 95],
    queryFn: () => queries.getDailyLogsHistory(95),
  });
  const { data: summariesHistory } = useQuery({
    queryKey: ["nutrition-history", 95],
    queryFn: () => queries.getNutritionSummaries(95),
  });
  const { data: mindLogs } = useQuery({
    queryKey: ["all-mind-logs"],
    queryFn: () => queries.getAllMindLogs(),
  });

  // Same calorie budget the Nutrition page and Tonight Lock use, so the
  // dashboard never quotes a different target (2400) than the rest of the app.
  const calorieBudget = useMemo(
    () =>
      nutritionSummary
        ? calculateDailyBudget(nutritionSummary.tdee_snapshot, nutritionSummary.deficit_target_snapshot)
        : undefined,
    [nutritionSummary]
  );

  // ---------- Derived data ----------
  const todaySchedule = useMemo(() => {
    const dow = format(today, "EEEE").toLowerCase() as DayOfWeek;
    return WORKOUT_SCHEDULE.find((s) => s.day === dow) ?? null;
  }, [today]);

  const phase = useMemo(
    () => getTrainingPhase(userProfile?.sprint_start_date, dateKey),
    [userProfile?.sprint_start_date, dateKey]
  );

  const sprint = useMemo(
    () => getSprintProgress(userProfile?.sprint_start_date, dateKey),
    [userProfile?.sprint_start_date, dateKey]
  );

  const projection = useMemo(
    () =>
      projectFatLoss(
        weightHistory ?? [],
        userProfile?.sprint_start_date,
        dateKey,
        userProfile?.goal_weight_kg ?? null
      ),
    [weightHistory, userProfile?.sprint_start_date, userProfile?.goal_weight_kg, dateKey]
  );

  const proteinConsumed = useMemo(
    () => totalProtein(dailyLog?.meals ?? []),
    [dailyLog]
  );
  const proteinFloor =
    userProfile?.protein_floor_g ??
    defaultProteinFloor(userProfile?.goal_weight_kg ?? null, userProfile?.weight_kg ?? 151);

  const adherence = useMemo(() => {
    if (!userProfile) return null;
    const logs = [...(logsHistory ?? []), ...(dailyLog ? [dailyLog] : [])];
    const summaries = [...(summariesHistory ?? []), ...(nutritionSummary ? [nutritionSummary] : [])];
    return summariseAdherence(
      dateKey,
      userProfile.sprint_start_date,
      logs,
      summaries,
      mindLogs ?? [],
      userProfile
    );
  }, [userProfile, logsHistory, dailyLog, summariesHistory, nutritionSummary, mindLogs, dateKey]);

  const totalCalories = useMemo(() => {
    if (!dailyLog) return 0;
    return dailyLog.meals.reduce((sum, m) => sum + m.calories, 0);
  }, [dailyLog]);

  // ---------- Optimistic helper ----------
  function optimisticDailyLog(updater: (prev: DailyLog) => DailyLog) {
    return {
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: ["daily-log", dateKey] });
        const previous = queryClient.getQueryData<DailyLog>(["daily-log", dateKey]);
        if (previous) {
          queryClient.setQueryData(["daily-log", dateKey], updater(previous));
        }
        return { previous };
      },
      onError: (_err: Error, _arg: unknown, context: { previous?: DailyLog } | undefined) => {
        if (context?.previous) {
          queryClient.setQueryData(["daily-log", dateKey], context.previous);
        }
      },
      onSuccess: (data: DailyLog) => {
        queryClient.setQueryData(["daily-log", dateKey], data);
        queryClient.invalidateQueries({ queryKey: ["daily-log", dateKey] });
      },
    };
  }

  // ---------- Mutations ----------
  const updateStepsMutation = useMutation<DailyLog, Error, number, { previous?: DailyLog }>({
    mutationFn: (steps) => queries.updateSteps(dateKey, steps),
    onMutate: async (steps) => {
      await queryClient.cancelQueries({ queryKey: ["daily-log", dateKey] });
      const previous = queryClient.getQueryData<DailyLog>(["daily-log", dateKey]);
      if (previous) {
        queryClient.setQueryData(["daily-log", dateKey], { ...previous, steps });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["daily-log", dateKey], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["daily-log", dateKey], data);
    },
  });

  const addMealMutation = useMutation<DailyLog, Error, InsertMeal, { previous?: DailyLog }>({
    mutationFn: (meal) => queries.addMeal(dateKey, meal),
    onMutate: async (meal) => {
      await queryClient.cancelQueries({ queryKey: ["daily-log", dateKey] });
      const previous = queryClient.getQueryData<DailyLog>(["daily-log", dateKey]);
      if (previous) {
        queryClient.setQueryData(["daily-log", dateKey], {
          ...previous,
          meals: [
            ...previous.meals,
            {
              id: `temp-${Date.now()}`,
              name: meal.name,
              calories: meal.calories,
              loggedAt: new Date().toISOString(),
              source: meal.source,
              proteinG: meal.proteinG,
              carbsG: meal.carbsG,
              fatG: meal.fatG,
              photoAnalysis: meal.photoAnalysis,
            },
          ],
        });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["daily-log", dateKey], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["daily-log", dateKey], data);
    },
  });

  const toggleMorningWalkMutation = useMutation<DailyLog, Error, void, { previous?: DailyLog }>({
    mutationFn: () => queries.toggleMorningWalk(dateKey),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["daily-log", dateKey] });
      const previous = queryClient.getQueryData<DailyLog>(["daily-log", dateKey]);
      if (previous) {
        queryClient.setQueryData(["daily-log", dateKey], {
          ...previous,
          morning_walk_completed: !previous.morning_walk_completed,
        });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["daily-log", dateKey], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["daily-log", dateKey], data);
    },
  });

  const toggleEveningWalkMutation = useMutation<DailyLog, Error, void, { previous?: DailyLog }>({
    mutationFn: () => queries.toggleEveningWalk(dateKey),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["daily-log", dateKey] });
      const previous = queryClient.getQueryData<DailyLog>(["daily-log", dateKey]);
      if (previous) {
        queryClient.setQueryData(["daily-log", dateKey], {
          ...previous,
          evening_walk_completed: !previous.evening_walk_completed,
        });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["daily-log", dateKey], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["daily-log", dateKey], data);
    },
  });

  const toggleFruitMutation = useMutation<DailyLog, Error, void, { previous?: DailyLog }>({
    mutationFn: () => queries.toggleFruit(dateKey),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["daily-log", dateKey] });
      const previous = queryClient.getQueryData<DailyLog>(["daily-log", dateKey]);
      if (previous) {
        queryClient.setQueryData(["daily-log", dateKey], {
          ...previous,
          fruit_eaten: !previous.fruit_eaten,
        });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["daily-log", dateKey], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["daily-log", dateKey], data);
    },
  });

  const updateWaterMutation = useMutation<DailyLog, Error, number, { previous?: DailyLog }>({
    mutationFn: (bottles) => queries.updateWater(dateKey, bottles),
    onMutate: async (bottles) => {
      await queryClient.cancelQueries({ queryKey: ["daily-log", dateKey] });
      const previous = queryClient.getQueryData<DailyLog>(["daily-log", dateKey]);
      if (previous) {
        queryClient.setQueryData(["daily-log", dateKey], {
          ...previous,
          water_bottles: bottles,
        });
      }
      return { previous };
    },
    onError: (_err, _arg, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["daily-log", dateKey], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["daily-log", dateKey], data);
    },
  });

  // ---------- Photo analysis flow ----------
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [suggestedMealName, setSuggestedMealName] = useState("");
  const [suggestedMealType, setSuggestedMealType] = useState("");
  const [clarificationNeeded, setClarificationNeeded] = useState<{ question: string; options: string[] } | null>(null);
  const [analysisError, setAnalysisError] = useState("");

  const handlePhotoCapture = useCallback(async (imageUri: string) => {
    setIsAnalyzing(true);
    setAnalysisStage("Analyzing...");
    setAnalysisError("");
    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageUri }),
      });
      const result = await response.json();
      if (result.success && result.analysis) {
        setReviewData(result.analysis);
        setSuggestedMealName(result.suggestedMealName ?? "Detected meal");
        setSuggestedMealType(result.suggestedMealType ?? "meal");
        setClarificationNeeded(null);
        setCameraOpen(false);
        setReviewOpen(true);
      } else {
        setAnalysisError("Could not analyse photo. Try again.");
      }
    } catch {
      setAnalysisError("Photo analysis failed. Try again.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage("");
    }
  }, []);

  const handleReviewConfirm = useCallback((items: import("@/lib/types").DetectedFoodItem[], totalCal: number) => {
    addMealMutation.mutate({
      name: suggestedMealName || items.map(i => i.name).join(" + ") || "Unknown meal",
      calories: totalCal,
      source: "photo_ai",
      photoAnalysis: { detectedItems: items, totalCalories: totalCal, estimationQualityScore: reviewData?.estimationQualityScore ?? 0.5 },
    });
    setReviewOpen(false);
    setReviewData(null);
  }, [addMealMutation, reviewData, suggestedMealName]);

  const handleManualMeal = useCallback(
    async (meal: InsertMeal) => {
      addMealMutation.mutate(meal);
      setManualFormOpen(false);
    },
    [addMealMutation]
  );

  const handleStepSubmit = useCallback(
    (steps: number) => {
      updateStepsMutation.mutate(steps);
      setStepInputOpen(false);
    },
    [updateStepsMutation]
  );

  // ---------- Loading skeleton ----------
  if (logLoading || !dailyLog) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-12 space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-[hsl(var(--muted))] rounded animate-pulse" />
          <div className="h-4 w-48 bg-[hsl(var(--muted))] rounded animate-pulse" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="glass-card p-6 h-32 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-12 space-y-4">
      {/* ---------- Date ---------- */}
      <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
        {dayName}, {fullDate}
      </p>

      {/* ---------- Sprint Header ---------- */}
      <SprintHeader
        progress={sprint}
        phaseLabel={phase.label}
        isDeload={phase.isDeload}
        projection={projection}
      />

      {/* ---------- Line Held (body + mind + streak) ---------- */}
      {adherence && <LineHeldCard lineHeld={adherence.today} streak={adherence.streak} />}

      {/* ---------- Insight Card ---------- */}
      <InsightCard
        insight={insight ?? null}
        onAction={(action) => {
          if (action === "dismiss") {
            queries.dismissInsight(dateKey).then(() =>
              queryClient.invalidateQueries({ queryKey: ["insight", dateKey] })
            );
          }
        }}
      />

      {/* ---------- Tonight Lock Modal ---------- */}
      {tonightLock?.shouldShow && (
        <TonightLock />
      )}

      {/* ---------- Steps Card ---------- */}
      {stepInputOpen ? (
        <StepInput
          currentSteps={dailyLog.steps}
          onSubmit={handleStepSubmit}
          onCancel={() => setStepInputOpen(false)}
          isPending={updateStepsMutation.isPending}
        />
      ) : (
        <button
          onClick={() => setStepInputOpen(true)}
          className="glass-card p-5 w-full text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Steps
            </h3>
            <span className="text-xs font-medium text-[hsl(var(--primary))]">
              Tap to update
            </span>
          </div>
          <div className="flex items-center gap-5">
            <StepRing
              current={dailyLog.steps}
              goal={dailyLog.steps_goal}
            />
            <div>
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
                {dailyLog.steps.toLocaleString()}
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                of {dailyLog.steps_goal.toLocaleString()} goal
              </p>
            </div>
          </div>
        </button>
      )}

      {/* ---------- Nutrition Card ---------- */}
      <section className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Nutrition
          </h3>
          <span className="text-sm font-bold text-[hsl(var(--foreground))]">
            {totalCalories} cal
          </span>
        </div>

        <CalorieBar
          consumed={totalCalories}
          goal={calorieBudget ?? dailyLog.calories_goal}
          fruitEaten={dailyLog.fruit_eaten}
        />

        {/* Protein floor */}
        <div className="mt-4">
          <ProteinBar consumed={proteinConsumed} floor={proteinFloor} />
        </div>

        {/* Fruit checkbox */}
        <button
          onClick={() => toggleFruitMutation.mutate()}
          className="flex items-center gap-3 mt-4 py-2 w-full active:opacity-70 transition-opacity"
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
              dailyLog.fruit_eaten
                ? "bg-[hsl(var(--chart-3))]"
                : "bg-[rgba(0,0,0,0.06)]"
            }`}
          >
            {dailyLog.fruit_eaten && (
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium text-[hsl(var(--foreground))]">
            Fruit eaten today
          </span>
        </button>

        {/* Meals list */}
        {dailyLog.meals.length > 0 && (
          <div className="mt-4 space-y-2">
            {dailyLog.meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))] last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {meal.name}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {meal.source === "photo_ai" ? "Photo AI" : "Manual"}
                    {" · "}
                    {format(new Date(meal.loggedAt), "h:mm a")}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {meal.calories} cal
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error feedback */}
        {analysisError && (
          <p className="text-xs text-[hsl(var(--destructive))] mt-2">{analysisError}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => { setCameraOpen(true); setAnalysisError(""); }}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[hsl(var(--primary))] text-white active:scale-[0.97] transition-transform"
          >
            Photo Log
          </button>
          <button
            onClick={() => setFoodSearchOpen(true)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[rgba(0,0,0,0.08)] bg-white/60 text-[hsl(var(--foreground))] active:scale-[0.97] active:bg-[rgba(0,0,0,0.04)] transition-all"
          >
            Log Food
          </button>
        </div>
      </section>

      {/* ---------- Camera & Review ---------- */}
      {cameraOpen && (
        <FoodCamera
          onCapture={handlePhotoCapture}
          onClose={() => setCameraOpen(false)}
          isAnalyzing={isAnalyzing}
          analysisStage={analysisStage}
        />
      )}

      <FoodReviewSheet
        open={reviewOpen}
        onOpenChange={(open) => {
          setReviewOpen(open);
          if (!open) setReviewData(null);
        }}
        analysis={reviewData}
        suggestedMealName={suggestedMealName}
        suggestedMealType={suggestedMealType}
        clarificationNeeded={clarificationNeeded}
        onConfirm={handleReviewConfirm}
        onRetake={() => {
          setReviewOpen(false);
          setReviewData(null);
          setCameraOpen(true);
        }}
      />

      {/* ---------- Food Search ---------- */}
      <FoodSearch
        open={foodSearchOpen}
        onOpenChange={setFoodSearchOpen}
        onSubmit={(meal) => {
          addMealMutation.mutate(meal);
          setFoodSearchOpen(false);
        }}
        onCustomMeal={() => setManualFormOpen(true)}
        recentMeals={dailyLog.meals.map((m) => ({ name: m.name, calories: m.calories }))}
      />

      {/* ---------- Manual Meal Form ---------- */}
      <MealForm
        onSubmit={handleManualMeal}
        isPending={addMealMutation.isPending}
        open={manualFormOpen}
        onOpenChange={setManualFormOpen}
      />

      {/* ---------- Hydration Card ---------- */}
      <section className="glass-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">
          Hydration
        </h3>
        <WaterTracker
          bottles={dailyLog.water_bottles}
          goal={dailyLog.water_goal}
          onUpdate={(bottles) => updateWaterMutation.mutate(bottles)}
          isPending={updateWaterMutation.isPending}
        />
      </section>

      {/* ---------- Workout Card ---------- */}
      {todaySchedule && (
        <WorkoutCard
          schedule={todaySchedule}
          date={dateKey}
          exerciseLogs={dailyLog.exercise_logs ?? {}}
          morningWalkCompleted={dailyLog.morning_walk_completed}
          eveningWalkCompleted={dailyLog.evening_walk_completed}
          phase={phase}
          onToggleMorningWalk={() => toggleMorningWalkMutation.mutate()}
          onToggleEveningWalk={() => toggleEveningWalkMutation.mutate()}
        />
      )}
    </div>
  );
}
