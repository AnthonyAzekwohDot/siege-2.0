"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from "date-fns";

import * as queries from "@/lib/queries";
import type { DailyLog } from "@/lib/types";
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

function computeMonthStats(logs: DailyLog[], year: number, month: number): MonthStats {
  const monthLogs = logs.filter((l) => {
    const d = parseISO(l.date);
    return d.getFullYear() === year && d.getMonth() === month;
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
  const daysTracked = monthLogs.length;

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

// ---------- Main Page ----------

export default function ProgressPage() {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

  const { data: allLogs, isLoading } = useQuery({
    queryKey: ["all-logs"],
    queryFn: () => queries.getAllLogs(),
  });

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
      const d = parseISO(log.date);
      months.add(`${d.getFullYear()}-${d.getMonth()}`);
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

      {/* ---------- Month Selector ---------- */}
      <div className="glass-card p-4 flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
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
          disabled={isCurrentMonth}
          className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-30"
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
