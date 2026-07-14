"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek } from "date-fns";

import * as queries from "@/lib/queries";
import { WORKOUT_SCHEDULE, getTrainingPhase } from "@/lib/constants";
import type { DailyLog, DayOfWeek } from "@/lib/types";
import { WorkoutCard } from "@/components/dashboard/workout-card";

// ============================================================
// Workout — do and log today's session (any day of the week)
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

export default function WorkoutPage() {
  const queryClient = useQueryClient();
  const todayDow = format(STABLE_NOW, "EEEE").toLowerCase() as DayOfWeek;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDow);

  const dateKey = getDateForDay(selectedDay);

  const { data: dailyLog, isLoading } = useQuery({
    queryKey: ["daily-log", dateKey],
    queryFn: () => queries.getOrCreateDailyLog(dateKey),
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => queries.getUserProfile(),
  });

  const schedule = useMemo(
    () => WORKOUT_SCHEDULE.find((s) => s.day === selectedDay) ?? null,
    [selectedDay]
  );

  const phase = useMemo(
    () => getTrainingPhase(userProfile?.sprint_start_date, dateKey),
    [userProfile?.sprint_start_date, dateKey]
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

      {schedule?.isOptional && (
        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--chart-4))/0.15] text-[hsl(var(--chart-4))] font-semibold uppercase">
          Optional
        </span>
      )}

      {/* ---------- Today's session — do it, log it ---------- */}
      {schedule && (
        <WorkoutCard
          schedule={schedule}
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
