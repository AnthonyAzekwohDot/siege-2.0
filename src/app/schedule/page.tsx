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
  Weight,
  Minus,
  Plus,
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

function getDateForDay(day: DayOfWeek): string {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const dayIndex = DAYS.indexOf(day);
  return format(addDays(weekStart, dayIndex), "yyyy-MM-dd");
}

// ---------- Exercise Card (inline, collapsible) ----------

function ExerciseCard({
  exercise,
  isCompleted,
  currentWeight,
  onToggle,
  onWeightChange,
}: {
  exercise: Exercise;
  isCompleted: boolean;
  currentWeight: number | undefined;
  onToggle: () => void;
  onWeightChange: (weight: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card p-4">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isCompleted
              ? "bg-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]"
              : "border-[hsl(var(--input))]"
          }`}
        >
          {isCompleted && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${
              isCompleted
                ? "line-through text-[hsl(var(--muted-foreground))]"
                : "text-[hsl(var(--foreground))]"
            }`}
          >
            {exercise.name}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {exercise.sets} x {exercise.reps}
          </p>
        </div>

        {/* Muscle group badges */}
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
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 space-y-3 border-t border-[hsl(var(--border))] pt-3">
          {/* Form diagram */}
          {exercise.diagram && (
            <pre className="text-xs font-mono text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] p-3 rounded-lg overflow-x-auto whitespace-pre">
              {exercise.diagram.trim()}
            </pre>
          )}

          {/* Instructions */}
          {exercise.instructions && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              {exercise.instructions}
            </p>
          )}

          {/* Weight input */}
          <div className="flex items-center gap-3">
            <Weight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              Weight:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onWeightChange(Math.max(0, (currentWeight ?? 0) - 2.5))
                }
                className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-bold text-[hsl(var(--foreground))] min-w-[60px] text-center">
                {currentWeight ?? 0} kg
              </span>
              <button
                onClick={() =>
                  onWeightChange((currentWeight ?? 0) + 2.5)
                }
                className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
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
  const todayDow = format(new Date(), "EEEE").toLowerCase() as DayOfWeek;

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
              {format(
                addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), DAYS.indexOf(day)),
                "d"
              )}
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
  const todayDow = format(new Date(), "EEEE").toLowerCase() as DayOfWeek;
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

  const updateWeightMutation = useMutation<DailyLog, Error, { exerciseName: string; weight: number }, { previous?: DailyLog }>({
    mutationFn: ({ exerciseName, weight }) =>
      queries.updateExerciseWeight(dateKey, exerciseName, weight),
    onMutate: async ({ exerciseName, weight }) => {
      await queryClient.cancelQueries({ queryKey: ["daily-log", dateKey] });
      const previous = queryClient.getQueryData<DailyLog>(["daily-log", dateKey]);
      if (previous) {
        queryClient.setQueryData(["daily-log", dateKey], {
          ...previous,
          exercise_weights: {
            ...previous.exercise_weights,
            [exerciseName]: weight,
          },
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

  const toggleExerciseMutation = useMutation<DailyLog, Error, string, { previous?: DailyLog }>({
    mutationFn: (exerciseName) => queries.toggleExercise(dateKey, exerciseName),
    onMutate: async (exerciseName) => {
      await queryClient.cancelQueries({ queryKey: ["daily-log", dateKey] });
      const previous = queryClient.getQueryData<DailyLog>(["daily-log", dateKey]);
      if (previous) {
        const isCompleted = previous.completed_exercises.includes(exerciseName);
        queryClient.setQueryData(["daily-log", dateKey], {
          ...previous,
          completed_exercises: isCompleted
            ? previous.completed_exercises.filter((e) => e !== exerciseName)
            : [...previous.completed_exercises, exerciseName],
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

  // Loading
  if (isLoading || !dailyLog) {
    return (
      <main className="max-w-2xl mx-auto p-4 pb-32 space-y-4">
        <div className="h-16 bg-[hsl(var(--muted))] rounded-xl animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-6 h-24 animate-pulse" />
        ))}
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-4 pb-32 space-y-4">
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
            <ExerciseCard
              key={exercise.name}
              exercise={exercise}
              isCompleted={dailyLog.completed_exercises.includes(exercise.name)}
              currentWeight={dailyLog.exercise_weights[exercise.name]}
              onToggle={() => toggleExerciseMutation.mutate(exercise.name)}
              onWeightChange={(weight) =>
                updateWeightMutation.mutate({
                  exerciseName: exercise.name,
                  weight,
                })
              }
            />
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
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[hsl(var(--chart-4))/0.15] flex items-center justify-center">
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
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  30-45 min
                </span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  dailyLog.morning_walk_completed
                    ? "bg-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]"
                    : "border-[hsl(var(--input))]"
                }`}
              >
                {dailyLog.morning_walk_completed && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {schedule.eveningWalk && (
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[hsl(var(--chart-5))/0.15] flex items-center justify-center">
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
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  15-20 min
                </span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  dailyLog.evening_walk_completed
                    ? "bg-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]"
                    : "border-[hsl(var(--input))]"
                }`}
              >
                {dailyLog.evening_walk_completed && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
