"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";

import * as queries from "@/lib/queries";
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyBudget,
  calculateNetDeficit,
  isOnTrack,
} from "@/lib/calculations";
import type { DailyLog, DailyNutritionSummary, UserProfile, InsertMeal, PhotoAnalysis } from "@/lib/types";
import {
  TrendingDown,
  TrendingUp,
  Flame,
  Apple,
  Camera,
  PenLine,
  Trash2,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

import { FoodCamera } from "@/components/dashboard/food-camera";
import { FoodReviewSheet } from "@/components/dashboard/food-review-sheet";
import { MealForm } from "@/components/dashboard/meal-form";

// ============================================================
// Nutrition — Calorie deficit tracking
// ============================================================

export default function NutritionPage() {
  const queryClient = useQueryClient();
  const today = new Date();
  const dateKey = format(today, "yyyy-MM-dd");

  const [cameraOpen, setCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("");
  const [reviewData, setReviewData] = useState<PhotoAnalysis | null>(null);
  const [manualFormOpen, setManualFormOpen] = useState(false);

  // ---------- Queries ----------
  const { data: dailyLog, isLoading: logLoading } = useQuery({
    queryKey: ["daily-log", dateKey],
    queryFn: () => queries.getOrCreateDailyLog(dateKey),
  });

  const { data: nutritionSummary, isLoading: nutritionLoading } = useQuery({
    queryKey: ["nutrition-summary", dateKey],
    queryFn: () => queries.getOrCreateNutritionSummary(dateKey),
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => queries.getUserProfile(),
  });

  const { data: nutritionHistory } = useQuery({
    queryKey: ["nutrition-history", 7],
    queryFn: () => queries.getNutritionSummaries(7),
  });

  const { data: logsHistory } = useQuery({
    queryKey: ["daily-logs-history", 7],
    queryFn: () => queries.getDailyLogsHistory(7),
  });

  // ---------- Derived calculations ----------
  const deficitData = useMemo(() => {
    if (!nutritionSummary || !dailyLog || !userProfile) return null;

    const bmr = calculateBMR(
      userProfile.weight_kg,
      userProfile.height_cm,
      userProfile.age,
      userProfile.sex
    );
    const tdee = calculateTDEE(bmr, userProfile.activity_level);
    const totalEaten = dailyLog.meals.reduce((sum, m) => sum + m.calories, 0);
    const totalExerted = nutritionSummary.exertions.reduce(
      (sum, e) => sum + e.calories,
      0
    );
    const budget = calculateDailyBudget(tdee, userProfile.deficit_target, totalExerted);
    const netDeficit = calculateNetDeficit(tdee, totalExerted, totalEaten);
    const onTrack = isOnTrack(netDeficit, userProfile.deficit_target);

    return {
      tdee,
      totalEaten,
      totalExerted,
      budget,
      netDeficit,
      onTrack,
      deficitTarget: userProfile.deficit_target,
      remaining: budget - totalEaten,
    };
  }, [nutritionSummary, dailyLog, userProfile]);

  // ---------- Weekly trend ----------
  const weeklyTrend = useMemo(() => {
    if (!nutritionHistory || !logsHistory || !userProfile) return [];

    return Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(today, 6 - i), "yyyy-MM-dd");
      const log = logsHistory.find((l) => l.date === date);
      const summary = nutritionHistory.find((s) => s.date === date);

      if (!log || !summary) {
        return { date, deficit: 0, hasData: false };
      }

      const eaten = log.meals.reduce((s, m) => s + m.calories, 0);
      const exerted = summary.exertions.reduce((s, e) => s + e.calories, 0);
      const deficit = calculateNetDeficit(
        summary.tdee_snapshot,
        exerted,
        eaten
      );

      return { date, deficit, hasData: true };
    });
  }, [nutritionHistory, logsHistory, userProfile, today]);

  // ---------- Mutations ----------
  const deleteMealMutation = useMutation<DailyLog, Error, string, { previous?: DailyLog }>({
    mutationFn: (mealId) => queries.deleteMeal(dateKey, mealId),
    onMutate: async (mealId) => {
      await queryClient.cancelQueries({ queryKey: ["daily-log", dateKey] });
      const previous = queryClient.getQueryData<DailyLog>(["daily-log", dateKey]);
      if (previous) {
        queryClient.setQueryData(["daily-log", dateKey], {
          ...previous,
          meals: previous.meals.filter((m) => m.id !== mealId),
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
      queryClient.invalidateQueries({ queryKey: ["daily-log", dateKey] });
    },
  });

  const addMealMutation = useMutation<DailyLog, Error, InsertMeal>({
    mutationFn: (meal) => queries.addMeal(dateKey, meal),
    onSuccess: (data) => {
      queryClient.setQueryData(["daily-log", dateKey], data);
      queryClient.invalidateQueries({ queryKey: ["daily-log", dateKey] });
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

  // ---------- Photo flow ----------
  const handlePhotoCapture = useCallback(async (imageBase64: string) => {
    setIsAnalyzing(true);
    setAnalysisStage("Detecting foods...");
    try {
      setTimeout(() => setAnalysisStage("Estimating portions..."), 1500);
      setTimeout(() => setAnalysisStage("Calculating calories..."), 3000);
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const result = await response.json();
      if (result.success && result.analysis) {
        setCameraOpen(false);
        setReviewData(result.analysis);
      }
    } catch {
      // fail silently
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage("");
    }
  }, []);

  const handleReviewConfirm = useCallback(
    (meal: InsertMeal) => {
      addMealMutation.mutate(meal);
      setReviewData(null);
    },
    [addMealMutation]
  );

  const handleManualMeal = useCallback(
    (meal: InsertMeal) => {
      addMealMutation.mutate(meal);
      setManualFormOpen(false);
    },
    [addMealMutation]
  );

  // ---------- Loading ----------
  if (logLoading || nutritionLoading || !dailyLog || !nutritionSummary) {
    return (
      <main className="max-w-2xl mx-auto p-4 pb-32 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 h-28 animate-pulse" />
        ))}
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-4 pb-32 space-y-4">
      {/* ---------- Calorie Deficit Card ---------- */}
      <section className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Calorie Deficit
          </h3>
          {deficitData && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                deficitData.onTrack
                  ? "bg-[hsl(var(--chart-3))/0.15] text-[hsl(var(--chart-3))]"
                  : "bg-[hsl(var(--destructive))/0.15] text-[hsl(var(--destructive))]"
              }`}
            >
              {deficitData.onTrack ? "On Track" : "Off Track"}
            </span>
          )}
        </div>

        {deficitData && (
          <div className="space-y-3">
            {/* Main numbers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">
                  TDEE
                </p>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">
                  {deficitData.tdee.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">
                  Eaten
                </p>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">
                  {deficitData.totalEaten.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">
                  Exerted
                </p>
                <p className="text-lg font-bold text-[hsl(var(--chart-3))]">
                  +{deficitData.totalExerted.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">
                  Budget
                </p>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">
                  {deficitData.budget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Deficit bar */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Net Deficit
                </span>
                <span
                  className={`text-sm font-bold ${
                    deficitData.onTrack
                      ? "text-[hsl(var(--chart-3))]"
                      : "text-[hsl(var(--destructive))]"
                  }`}
                >
                  {deficitData.netDeficit.toLocaleString()} cal
                </span>
              </div>
              <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    deficitData.onTrack
                      ? "bg-[hsl(var(--chart-3))]"
                      : "bg-[hsl(var(--destructive))]"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (deficitData.netDeficit / deficitData.deficitTarget) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Target: {deficitData.deficitTarget.toLocaleString()} cal deficit
              </p>
            </div>

            {/* Remaining */}
            <div className="flex items-center gap-2 pt-2 border-t border-[hsl(var(--border))]">
              <Zap className="w-4 h-4 text-[hsl(var(--chart-4))]" />
              <span className="text-sm text-[hsl(var(--foreground))]">
                <span className="font-bold">
                  {deficitData.remaining > 0
                    ? `${deficitData.remaining.toLocaleString()} cal remaining`
                    : `${Math.abs(deficitData.remaining).toLocaleString()} cal over budget`}
                </span>
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ---------- Weekly Trend ---------- */}
      <section className="glass-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">
          7-Day Deficit Trend
        </h3>
        <div className="flex items-end gap-1.5 h-24">
          {weeklyTrend.map((day, i) => {
            if (!day.hasData) {
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-1 rounded-full bg-[hsl(var(--muted))]" />
                  <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
                    {format(subDays(today, 6 - i), "EEE")}
                  </span>
                </div>
              );
            }

            const maxDeficit = Math.max(
              ...weeklyTrend.filter((d) => d.hasData).map((d) => Math.abs(d.deficit)),
              1
            );
            const heightPct = Math.min(100, (Math.abs(day.deficit) / maxDeficit) * 100);
            const isPositive = day.deficit > 0;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-16">
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      isPositive
                        ? "bg-[hsl(var(--chart-3))]"
                        : "bg-[hsl(var(--destructive))]"
                    }`}
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                  />
                </div>
                <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
                  {format(subDays(today, 6 - i), "EEE")}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- Meals ---------- */}
      <section className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Today&apos;s Meals
          </h3>
          <span className="text-sm font-bold text-[hsl(var(--foreground))]">
            {dailyLog.meals.reduce((s, m) => s + m.calories, 0)} cal
          </span>
        </div>

        {dailyLog.meals.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">
            No meals logged yet today.
          </p>
        ) : (
          <div className="space-y-2">
            {dailyLog.meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center gap-3 py-2.5 border-b border-[hsl(var(--border))] last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                    {meal.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {meal.source === "photo_ai" ? "Photo AI" : "Manual"}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {format(new Date(meal.loggedAt), "h:mm a")}
                    </span>
                    {meal.proteinG && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        P:{meal.proteinG}g
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {meal.calories} cal
                </span>
                <button
                  onClick={() => deleteMealMutation.mutate(meal.id)}
                  className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))/0.1] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Fruit Checkbox ---------- */}
      <section className="glass-card p-4">
        <button
          onClick={() => toggleFruitMutation.mutate()}
          className="flex items-center gap-3 w-full"
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              dailyLog.fruit_eaten
                ? "bg-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]"
                : "border-[hsl(var(--input))]"
            }`}
          >
            {dailyLog.fruit_eaten && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <Apple className="w-4 h-4 text-[hsl(var(--chart-3))]" />
          <span className="text-sm font-medium text-[hsl(var(--foreground))]">
            Fruit eaten today
          </span>
        </button>
      </section>

      {/* ---------- Action Buttons ---------- */}
      <div className="flex gap-2">
        <button
          onClick={() => setCameraOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
        >
          <Camera className="w-4 h-4" />
          Photo Log
        </button>
        <button
          onClick={() => setManualFormOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-[hsl(var(--border))] text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))]"
        >
          <PenLine className="w-4 h-4" />
          Manual Log
        </button>
      </div>

      {/* ---------- Food Suggestions ---------- */}
      {userProfile && userProfile.safe_meals.length > 0 && (
        <section className="glass-card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">
            Safe Meals
          </h3>
          <div className="space-y-2">
            {userProfile.safe_meals.map((meal) => (
              <button
                key={meal.id}
                onClick={() =>
                  addMealMutation.mutate({
                    name: meal.name,
                    calories: meal.calories,
                    source: "manual",
                  })
                }
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {meal.name}
                </span>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {meal.calories} cal
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Camera & Review Modals ---------- */}
      {cameraOpen && (
        <FoodCamera
          onCapture={handlePhotoCapture}
          onClose={() => setCameraOpen(false)}
          isAnalyzing={isAnalyzing}
          analysisStage={analysisStage}
        />
      )}

      <FoodReviewSheet
        open={!!reviewData}
        onOpenChange={(open) => { if (!open) setReviewData(null); }}
        analysis={reviewData}
        suggestedMealName="Meal"
        suggestedMealType="lunch"
        clarificationNeeded={null}
        onConfirm={() => {
          if (reviewData) {
            const totalCalories = reviewData.detectedItems.reduce((sum, item) => sum + item.calories, 0);
            addMealMutation.mutate({
              name: reviewData.detectedItems.map(i => i.name).join(" + "),
              calories: totalCalories,
              source: "photo_ai",
              photoAnalysis: reviewData,
            });
            setReviewData(null);
          }
        }}
        onRetake={() => {
          setReviewData(null);
          setCameraOpen(true);
        }}
      />

      <MealForm
        open={manualFormOpen}
        onOpenChange={setManualFormOpen}
        onSubmit={async (meal) => {
          addMealMutation.mutate(meal);
          setManualFormOpen(false);
        }}
        isPending={addMealMutation.isPending}
      />
    </main>
  );
}
