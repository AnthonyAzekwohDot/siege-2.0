"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek } from "date-fns";

import * as queries from "@/lib/queries";
import { WORKOUT_SCHEDULE } from "@/lib/constants";
import type { DailyLog, DayOfWeek, DaySchedule, Exercise } from "@/lib/types";
import {
  Dumbbell,
  Coffee,
  Footprints,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ============================================================
// Schedule — Weekly workout view
// ============================================================

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const SHORT_DAYS: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const STABLE_NOW = new Date();
const STABLE_WEEK_START = startOfWeek(STABLE_NOW, { weekStartsOn: 1 });

function getDateForDay(day: DayOfWeek): string {
  const dayIndex = DAYS.indexOf(day);
  return format(addDays(STABLE_WEEK_START, dayIndex), "yyyy-MM-dd");
}

// ---------- Exercise Card (inline, collapsible) ----------

// Read-only planner card. Logging happens on the Home tab (one source of truth
// for completion: daily_logs.exercise_logs).
function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
            {exercise.name}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {exercise.sets} x {exercise.reps}
          </p>
        </div>

        <div className="flex gap-1 flex-wrap justify-end">
          {exercise.muscleGroups?.slice(0, 2).map((mg) => (
            <span
              key={mg}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium"
            >
              {mg}
            </span>
          ))}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-[hsl(var(--border))] pt-3">
          {exercise.instructions && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              {exercise.instructions}
            </p>
          )}
          {exercise.homeAlt && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              <span className="font-semibold text-[hsl(var(--foreground))]">Home (15kg): </span>
              {exercise.homeAlt}
            </p>
          )}
          {exercise.diagram && (
            <pre className="text-xs font-mono text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] p-3 rounded-lg overflow-x-auto whitespace-pre">
              {exercise.diagram.trim()}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Week Overview ----------

function WeekOverview({
  selectedDay,
  onSelectDay,
}: {
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
}) {
  const todayDow = format(STABLE_NOW, "EEEE").toLowerCase() as DayOfWeek;

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {DAYS.map((day) => {
        const schedule = WORKOUT_SCHEDULE.find((s) => s.day === day);
        const isToday = day === todayDow;
        const isSelected = day === selectedDay;
        const isRest = schedule?.isRestDay ?? false;

        return (
          <button
            key={day}
            onClick={() => onSelectDay(day)}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl min-w-[52px] transition-all ${
              isSelected
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
            }`}
          >
            <span className="text-[10px] font-semibold uppercase">
              {SHORT_DAYS[day]}
            </span>
            <span className="text-lg font-bold">
              {format(addDays(STABLE_WEEK_START, DAYS.indexOf(day)), "d")}
            </span>
            {isToday && (
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isSelected ? "bg-white" : "bg-[hsl(var(--primary))]"
                }`}
              />
            )}
            {!isToday && isRest && (
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--muted-foreground))] opacity-40" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Main Page ----------

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const todayDow = format(STABLE_NOW, "EEEE").toLowerCase() as DayOfWeek;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDow);

  const dateKey = getDateForDay(selectedDay);

  const { data: dailyLog, isLoading } = useQuery({
    queryKey: ["daily-log", dateKey],
    queryFn: () => queries.getOrCreateDailyLog(dateKey),
  });

  const schedule = useMemo(
    () => WORKOUT_SCHEDULE.find((s) => s.day === selectedDay) ?? null,
    [selectedDay]
  );

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
      if (context?.previous) queryClient.setQueryData(["daily-log", dateKey], context.previous);
    },
    onSuccess: (data) => { queryClient.setQueryData(["daily-log", dateKey], data); },
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
      if (context?.previous) queryClient.setQueryData(["daily-log", dateKey], context.previous);
    },
    onSuccess: (data) => { queryClient.setQueryData(["daily-log", dateKey], data); },
  });

  // Loading
  if (isLoading || !dailyLog) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-12 space-y-4">
        <div className="h-16 bg-[hsl(var(--muted))] rounded-xl animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-6 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-12 space-y-4">
      {/* ---------- Week Overview ---------- */}
      <WeekOverview selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      {/* ---------- Day Header ---------- */}
      {schedule && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center">
              {schedule.isRestDay ? (
                <Coffee className="w-5 h-5 text-white" />
              ) : (
                <Dumbbell className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                {schedule.focus}
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {schedule.purpose}
              </p>
            </div>
          </div>

          {schedule.isOptional && (
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--chart-4))/0.15] text-[hsl(var(--chart-4))] font-semibold uppercase">
              Optional
            </span>
          )}
        </div>
      )}

      {/* ---------- Rest Day Empty State ---------- */}
      {schedule?.isRestDay && schedule.exercises.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Coffee className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
            Rest Day
          </h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {schedule.purpose}
          </p>
        </div>
      )}

      {/* ---------- Exercises ---------- */}
      {schedule && schedule.exercises.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] px-1">
            Exercises
          </h3>
          {schedule.exercises.map((exercise) => (
            <ExerciseCard key={exercise.name} exercise={exercise} />
          ))}
        </div>
      )}

      {/* ---------- Walk Info ---------- */}
      {schedule && (schedule.morningWalk || schedule.eveningWalk) && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] px-1">
            Walks
          </h3>

          {schedule.morningWalk && (
            <button
              onClick={() => toggleMorningWalkMutation.mutate()}
              className="glass-card p-4 flex items-center gap-3 w-full text-left active:scale-[0.98] transition-transform"
            >
              <div className="w-9 h-9 rounded-lg bg-[hsl(var(--chart-4))]/15 flex items-center justify-center">
                <Footprints className="w-4 h-4 text-[hsl(var(--chart-4))]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Morning Walk
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  ~400 cal burn
                </p>
              </div>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                  dailyLog.morning_walk_completed
                    ? "bg-[hsl(var(--chart-3))]"
                    : "bg-[rgba(0,0,0,0.06)]"
                }`}
              >
                {dailyLog.morning_walk_completed && (
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          )}

          {schedule.eveningWalk && (
            <button
              onClick={() => toggleEveningWalkMutation.mutate()}
              className="glass-card p-4 flex items-center gap-3 w-full text-left active:scale-[0.98] transition-transform"
            >
              <div className="w-9 h-9 rounded-lg bg-[hsl(var(--chart-5))]/15 flex items-center justify-center">
                <Footprints className="w-4 h-4 text-[hsl(var(--chart-5))]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Evening Walk
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  ~150 cal burn
                </p>
              </div>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                  dailyLog.evening_walk_completed
                    ? "bg-[hsl(var(--chart-3))]"
                    : "bg-[rgba(0,0,0,0.06)]"
                }`}
              >
                {dailyLog.evening_walk_completed && (
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
