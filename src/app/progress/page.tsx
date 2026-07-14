"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subDays } from "date-fns";

import * as queries from "@/lib/queries";
import type { DailyLog } from "@/lib/types";
import { WORKOUT_SCHEDULE, getTrainingPhase } from "@/lib/constants";
import { getSprintProgress, projectFatLoss } from "@/lib/sprint";
import { computeWeeklyVerdict } from "@/lib/adherence";
import { recentPRs, byExerciseFromLogs } from "@/lib/overload";
import { SprintHeader } from "@/components/sprint/sprint-header";
import { WeeklyVerdictCard } from "@/components/sprint/weekly-verdict-card";
import {
  Footprints,
  Flame,
  Dumbbell,
  Activity,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  Target,
  Scale,
  Minus,
  Plus,
  Check,
  X,
  Trophy,
} from "lucide-react";

// ============================================================
// Progress — Historical analytics
// ============================================================

interface MonthStats {
  totalSteps: number;
  totalCalories: number;
  workoutDays: number;
  activeDays: number;
  avgSteps: number;
  avgCalories: number;
  daysTracked: number;
}

/** Parse "yyyy-MM-dd" into local-time parts without Date constructor timezone issues */
function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

function computeMonthStats(logs: DailyLog[], year: number, month: number): MonthStats {
  const monthLogs = logs.filter((l) => {
    const { year: y, month: m } = parseDateParts(l.date);
    return y === year && m === month;
  });

  const totalSteps = monthLogs.reduce((s, l) => s + l.steps, 0);
  const totalCalories = monthLogs.reduce(
    (s, l) => s + l.meals.reduce((ms, m) => ms + m.calories, 0),
    0
  );
  const workoutDays = monthLogs.filter(
    (l) => l.completed_exercises.length > 0
  ).length;
  const activeDays = monthLogs.filter(
    (l) =>
      l.steps > 0 ||
      l.meals.length > 0 ||
      l.completed_exercises.length > 0 ||
      l.morning_walk_completed ||
      l.evening_walk_completed
  ).length;
  const daysTracked = monthLogs.filter(
    (l) => l.steps > 0 || l.meals.length > 0 || l.completed_exercises.length > 0 || l.morning_walk_completed || l.evening_walk_completed || l.water_bottles > 0
  ).length;

  return {
    totalSteps,
    totalCalories,
    workoutDays,
    activeDays,
    avgSteps: daysTracked > 0 ? Math.round(totalSteps / daysTracked) : 0,
    avgCalories: daysTracked > 0 ? Math.round(totalCalories / daysTracked) : 0,
    daysTracked,
  };
}

function getActivityLevel(log: DailyLog): number {
  // Only show activity for days where user actually did something
  const hasActivity = log.steps > 0 || log.meals.length > 0 || log.completed_exercises.length > 0 || log.morning_walk_completed || log.evening_walk_completed || log.water_bottles > 0;
  if (!hasActivity) return 0;

  let score = 0;
  if (log.steps >= 10000) score += 2;
  else if (log.steps >= 5000) score += 1;
  if (log.completed_exercises.length > 0) score += 2;
  if (log.morning_walk_completed) score += 1;
  if (log.evening_walk_completed) score += 1;
  if (log.meals.length > 0) score += 1;
  return Math.min(score, 5);
}

const ACTIVITY_COLORS = [
  "bg-[hsl(var(--muted))]",
  "bg-[hsl(var(--chart-3))]/20",
  "bg-[hsl(var(--chart-3))]/40",
  "bg-[hsl(var(--chart-3))]/60",
  "bg-[hsl(var(--chart-3))]/80",
  "bg-[hsl(var(--chart-3))]",
];

// ---------- Stat Card ----------

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: typeof Footprints;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))]">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold text-[hsl(var(--foreground))]">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ---------- Calendar Grid ----------

function CalendarGrid({
  year,
  month,
  logs,
}: {
  year: number;
  month: number;
  logs: DailyLog[];
}) {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start for alignment (week starts Monday)
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const logMap = useMemo(() => {
    const map: Record<string, DailyLog> = {};
    for (const log of logs) {
      map[log.date] = log;
    }
    return map;
  }, [logs]);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] text-center py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding */}
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}

        {/* Actual days */}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const log = logMap[dateStr];
          const level = log ? getActivityLevel(log) : 0;
          const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

          return (
            <div
              key={dateStr}
              className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-colors ${
                ACTIVITY_COLORS[level]
              } ${
                isToday
                  ? "ring-1 ring-[hsl(var(--primary))] ring-offset-1"
                  : ""
              } ${
                level > 0
                  ? "text-[hsl(var(--foreground))]"
                  : "text-[hsl(var(--muted-foreground))]"
              }`}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Weight Chart (SVG) ----------

function WeightChart({ data }: { data: { date: string; weight_kg: number }[] }) {
  if (data.length < 2) {
    return (
      <div className="h-[120px] flex items-center justify-center text-xs text-[hsl(var(--muted-foreground))]">
        Log at least 2 weights to see the chart
      </div>
    );
  }

  const weights = data.map((d) => d.weight_kg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const padding = { top: 16, bottom: 24, left: 0, right: 0 };
  const chartH = 120;
  const chartW = 100; // percentage-based, we use viewBox

  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * innerW;
    const y = padding.top + innerH - ((d.weight_kg - minW) / range) * innerH;
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const isDownTrend = weights[weights.length - 1] <= weights[0];
  const strokeColor = isDownTrend ? "hsl(var(--chart-3))" : "hsl(var(--destructive))";

  return (
    <svg
      viewBox={`0 0 ${chartW} ${chartH}`}
      className="w-full"
      style={{ height: "120px" }}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Weight trend: ${weights[0].toFixed(1)}kg to ${weights[weights.length - 1].toFixed(1)}kg, ${isDownTrend ? "trending down" : "trending up"}`}
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = padding.top + innerH - frac * innerH;
        return (
          <line
            key={frac}
            x1={padding.left}
            y1={y}
            x2={chartW - padding.right}
            y2={y}
            stroke="hsl(var(--border))"
            strokeWidth="0.3"
          />
        );
      })}

      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="1.5"
          fill={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* Min/Max labels */}
      <text
        x={padding.left + 1}
        y={padding.top - 4}
        fontSize="5"
        fill="hsl(var(--muted-foreground))"
        dominantBaseline="auto"
      >
        {maxW.toFixed(1)}
      </text>
      <text
        x={padding.left + 1}
        y={padding.top + innerH + 10}
        fontSize="5"
        fill="hsl(var(--muted-foreground))"
        dominantBaseline="auto"
      >
        {minW.toFixed(1)}
      </text>
    </svg>
  );
}

// ---------- Weight Card ----------

function WeightCard() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [weightInput, setWeightInput] = useState(151);

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: weightHistory } = useQuery({
    queryKey: ["weight-history"],
    queryFn: () => queries.getWeightHistory(30),
  });

  const mutation = useMutation({
    mutationFn: () => queries.logWeight(today, weightInput),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-history"] });
      queryClient.invalidateQueries({ queryKey: ["all-logs"] });
      setShowForm(false);
    },
  });

  const currentWeight = weightHistory && weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].weight_kg
    : null;

  const firstWeight = weightHistory && weightHistory.length > 0
    ? weightHistory[0].weight_kg
    : null;

  const weightChange = currentWeight !== null && firstWeight !== null
    ? currentWeight - firstWeight
    : null;

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--chart-1) / 0.15)" }}
          >
            <Scale className="w-4 h-4" style={{ color: "hsl(var(--chart-1))" }} />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Weight
          </h3>
        </div>
        <button
          onClick={() => {
            if (currentWeight) setWeightInput(currentWeight);
            setShowForm(!showForm);
          }}
          className="text-xs font-semibold min-h-[44px] px-3 py-1.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
        >
          Log Weight
        </button>
      </div>

      {/* Current weight display */}
      <div className="flex items-baseline gap-3 mb-3">
        <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
          {currentWeight !== null ? `${currentWeight.toFixed(1)}` : "--"}
          <span className="text-base font-normal text-[hsl(var(--muted-foreground))] ml-1">kg</span>
        </p>
        {weightChange !== null && weightHistory && weightHistory.length > 1 && (
          <span
            className="text-sm font-semibold"
            style={{
              color: weightChange <= 0
                ? "hsl(var(--chart-3))"
                : "hsl(var(--destructive))",
            }}
          >
            {weightChange <= 0 ? "" : "+"}{weightChange.toFixed(1)} kg
          </span>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-[hsl(var(--muted))]">
          <button
            onClick={() => setWeightInput((v) => Math.round((v - 0.1) * 10) / 10)}
            aria-label="Decrease weight by 0.1kg"
            className="w-11 h-11 rounded-lg bg-[hsl(var(--background))] flex items-center justify-center text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-lg font-bold text-[hsl(var(--foreground))] min-w-[80px] text-center tabular-nums">
            {weightInput.toFixed(1)} kg
          </span>
          <button
            onClick={() => setWeightInput((v) => Math.round((v + 0.1) * 10) / 10)}
            aria-label="Increase weight by 0.1kg"
            className="w-11 h-11 rounded-lg bg-[hsl(var(--background))] flex items-center justify-center text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            aria-label="Save weight"
            className="w-11 h-11 rounded-lg bg-[hsl(var(--chart-3))] flex items-center justify-center text-white hover:opacity-90 transition-opacity ml-auto"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(false)}
            aria-label="Cancel"
            className="w-11 h-11 rounded-lg bg-[hsl(var(--background))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Chart */}
      {weightHistory && weightHistory.length > 0 && (
        <WeightChart data={weightHistory} />
      )}

      {/* Empty state */}
      {(!weightHistory || weightHistory.length === 0) && !showForm && (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          No weight data yet. Tap "Log Weight" to start tracking.
        </p>
      )}
    </section>
  );
}

// ---------- Main Page ----------

export default function ProgressPage() {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

  const { data: allLogs, isLoading } = useQuery({
    queryKey: ["all-logs"],
    queryFn: () => queries.getAllLogs(),
  });

  // ---------- Sprint + verdict data ----------
  const todayKey = format(today, "yyyy-MM-dd");
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: queries.getUserProfile,
  });
  const { data: summaries } = useQuery({
    queryKey: ["nutrition-history", 95],
    queryFn: () => queries.getNutritionSummaries(95),
  });
  const { data: mindLogs } = useQuery({
    queryKey: ["mind-logs-history", 95],
    queryFn: () => queries.getMindLogsHistory(95),
  });
  const { data: weightHistory } = useQuery({
    queryKey: ["weight-history", 90],
    queryFn: () => queries.getWeightHistory(90),
  });

  const sprint = useMemo(
    () => getSprintProgress(userProfile?.sprint_start_date, todayKey),
    [userProfile?.sprint_start_date, todayKey]
  );
  const phase = useMemo(
    () => getTrainingPhase(userProfile?.sprint_start_date, todayKey),
    [userProfile?.sprint_start_date, todayKey]
  );
  const projection = useMemo(
    () =>
      projectFatLoss(
        weightHistory ?? [],
        userProfile?.sprint_start_date,
        todayKey,
        userProfile?.goal_weight_kg ?? null
      ),
    [weightHistory, userProfile?.sprint_start_date, userProfile?.goal_weight_kg, todayKey]
  );
  const weeklyVerdict = useMemo(() => {
    if (!userProfile || !allLogs) return null;
    const dates = Array.from({ length: 7 }, (_, i) =>
      format(subDays(today, 6 - i), "yyyy-MM-dd")
    );
    return computeWeeklyVerdict(dates, allLogs, summaries ?? [], mindLogs ?? [], userProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, allLogs, summaries, mindLogs, todayKey]);

  const strengthPRs = useMemo(() => {
    if (!allLogs) return [];
    const bw = new Set<string>();
    for (const day of WORKOUT_SCHEDULE) for (const ex of day.exercises) if (ex.isBodyweight) bw.add(ex.name);
    return recentPRs(byExerciseFromLogs(allLogs), bw, 6);
  }, [allLogs]);

  // ---------- Month stats ----------
  const monthStats = useMemo(() => {
    if (!allLogs) return null;
    return computeMonthStats(allLogs, selectedYear, selectedMonth);
  }, [allLogs, selectedYear, selectedMonth]);

  // ---------- Overall stats ----------
  const overallStats = useMemo(() => {
    if (!allLogs || allLogs.length === 0) return null;

    const totalSteps = allLogs.reduce((s, l) => s + l.steps, 0);
    const totalCalories = allLogs.reduce(
      (s, l) => s + l.meals.reduce((ms, m) => ms + m.calories, 0),
      0
    );
    const workoutDays = allLogs.filter(
      (l) => l.completed_exercises.length > 0
    ).length;
    const activeDays = allLogs.filter(
      (l) =>
        l.steps > 0 ||
        l.meals.length > 0 ||
        l.completed_exercises.length > 0 ||
        l.morning_walk_completed ||
        l.evening_walk_completed
    ).length;

    return {
      totalSteps,
      totalCalories,
      workoutDays,
      activeDays,
      totalDays: allLogs.length,
      avgSteps: Math.round(totalSteps / allLogs.length),
    };
  }, [allLogs]);

  // ---------- Available months ----------
  const availableMonths = useMemo(() => {
    if (!allLogs || allLogs.length === 0) return [];

    const months = new Set<string>();
    for (const log of allLogs) {
      const { year: y, month: m } = parseDateParts(log.date);
      months.add(`${y}-${m}`);
    }

    // Always include current month
    months.add(`${today.getFullYear()}-${today.getMonth()}`);

    return Array.from(months)
      .map((m) => {
        const [y, mo] = m.split("-").map(Number);
        return { year: y, month: mo };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);
  }, [allLogs, today]);

  // ---------- Navigation ----------
  const goToPrevMonth = useCallback(() => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }, [selectedYear, selectedMonth]);

  const goToNextMonth = useCallback(() => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }, [selectedYear, selectedMonth]);

  const isCurrentMonth =
    selectedYear === today.getFullYear() &&
    selectedMonth === today.getMonth();

  // ---------- Loading ----------
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-12 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass-card p-6 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-12 space-y-4">
      {/* ---------- Header ---------- */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          Progress
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Historical analytics
        </p>
      </div>

      {/* ---------- Sprint Finish Line ---------- */}
      {userProfile && (
        <SprintHeader
          progress={sprint}
          phaseLabel={phase.label}
          isDeload={phase.isDeload}
          projection={projection}
        />
      )}

      {/* ---------- Weekly Verdict ---------- */}
      {weeklyVerdict && <WeeklyVerdictCard verdict={weeklyVerdict} />}

      {/* ---------- Weight Tracking ---------- */}
      <WeightCard />

      {/* ---------- Strength PRs ---------- */}
      {strengthPRs.length > 0 && (
        <section className="glass-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[hsl(var(--chart-4))]" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Strength · Recent PRs
            </h3>
          </div>
          <div className="space-y-2">
            {strengthPRs.map((pr) => (
              <div
                key={pr.exercise}
                className="flex items-center justify-between border-b border-[hsl(var(--border))] py-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">{pr.exercise}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{pr.date.slice(5)}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-[hsl(var(--chart-3))]">{pr.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[hsl(var(--muted-foreground))]">
            Tap any exercise on Home or Workout for its full history + next target.
          </p>
        </section>
      )}

      {/* ---------- Month Selector ---------- */}
      <div className="glass-card p-4 flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          aria-label="Previous month"
          className="grid place-items-center h-11 w-11 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-[hsl(var(--foreground))]">
            {format(new Date(selectedYear, selectedMonth), "MMMM yyyy")}
          </p>
          {monthStats && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {monthStats.daysTracked} days tracked
            </p>
          )}
        </div>
        <button
          onClick={goToNextMonth}
          aria-label="Next month"
          disabled={isCurrentMonth}
          className="grid place-items-center h-11 w-11 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ---------- Month Stats ---------- */}
      {monthStats && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={Footprints}
            label="Total Steps"
            value={monthStats.totalSteps.toLocaleString()}
            subtitle={`avg ${monthStats.avgSteps.toLocaleString()}/day`}
            color="hsl(var(--chart-1))"
          />
          <StatCard
            icon={Flame}
            label="Total Calories"
            value={monthStats.totalCalories.toLocaleString()}
            subtitle={`avg ${monthStats.avgCalories.toLocaleString()}/day`}
            color="hsl(var(--chart-4))"
          />
          <StatCard
            icon={Dumbbell}
            label="Workout Days"
            value={String(monthStats.workoutDays)}
            color="hsl(var(--chart-3))"
          />
          <StatCard
            icon={Activity}
            label="Active Days"
            value={String(monthStats.activeDays)}
            color="hsl(var(--chart-2))"
          />
        </div>
      )}

      {/* ---------- Calendar Grid ---------- */}
      <section className="glass-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">
          Activity Calendar
        </h3>
        <CalendarGrid
          year={selectedYear}
          month={selectedMonth}
          logs={allLogs ?? []}
        />

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 justify-center">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
            Less
          </span>
          {ACTIVITY_COLORS.map((color, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${color}`}
            />
          ))}
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
            More
          </span>
        </div>
      </section>

      {/* ---------- Overall Summary ---------- */}
      {overallStats && (
        <section className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Overall Summary
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))]">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Total Days Tracked
              </span>
              <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                {overallStats.totalDays}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))]">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Lifetime Steps
              </span>
              <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                {overallStats.totalSteps.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))]">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Average Steps/Day
              </span>
              <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                {overallStats.avgSteps.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))]">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Total Workout Days
              </span>
              <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                {overallStats.workoutDays}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))]">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Total Active Days
              </span>
              <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                {overallStats.activeDays}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Lifetime Calories Logged
              </span>
              <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                {overallStats.totalCalories.toLocaleString()}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Empty State ---------- */}
      {(!allLogs || allLogs.length === 0) && (
        <div className="glass-card p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
            No Data Yet
          </h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Start tracking from the Dashboard to see your progress here.
          </p>
        </div>
      )}
    </div>
  );
}
