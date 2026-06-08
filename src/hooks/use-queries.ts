"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrCreateDailyLog,
  getAllLogs,
  updateSteps,
  addMeal,
  deleteMeal,
  toggleExercise,
  toggleMorningWalk,
  toggleEveningWalk,
  toggleFruit,
  updateExerciseWeight,
  updateWater,
  getOrCreateMindLog,
  getAllMindLogs,
  addMindEntry,
  updateMindEntry,
  startMindTimer,
  stopMindTimer,
  toggleMinimumWinMode,
  getUserProfile,
  updateUserProfile,
  getOrCreateNutritionSummary,
  getNutritionSummaries,
  addExertion,
  deleteExertion,
  getDailyLogsHistory,
  generateInsight,
  upsertSet,
  getExerciseHistory,
} from "@/lib/queries";
import type { InsertMeal, InsertExertion, UpdateUserProfile, MindLogEntry, SetEntry, DailyLog } from "@/lib/types";

// ============ QUERY HOOKS ============

export function useDailyLog(date: string) {
  return useQuery({
    queryKey: ["daily-log", date],
    queryFn: () => getOrCreateDailyLog(date),
  });
}

export function useAllLogs() {
  return useQuery({
    queryKey: ["all-logs"],
    queryFn: () => getAllLogs(),
  });
}

export function useMindLog(date: string) {
  return useQuery({
    queryKey: ["mind-log", date],
    queryFn: () => getOrCreateMindLog(date),
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUserProfile(),
  });
}

export function useNutritionSummary(date: string) {
  return useQuery({
    queryKey: ["nutrition-summary", date],
    queryFn: () => getOrCreateNutritionSummary(date),
  });
}

export function useNutritionHistory(days: number) {
  return useQuery({
    queryKey: ["nutrition-history", days],
    queryFn: () => getNutritionSummaries(days),
  });
}

export function useDailyLogsHistory(days: number) {
  return useQuery({
    queryKey: ["daily-logs-history", days],
    queryFn: () => getDailyLogsHistory(days),
  });
}

export function useInsight(date: string) {
  return useQuery({
    queryKey: ["insight", date],
    queryFn: () => generateInsight(date),
  });
}

// ============ MUTATION HOOKS ============

export function useUpdateSteps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, steps }: { date: string; steps: number }) =>
      updateSteps(date, steps),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-log", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-summary", variables.date] });
    },
  });
}

export function useAddMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, meal }: { date: string; meal: InsertMeal }) =>
      addMeal(date, meal),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-log", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-summary", variables.date] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, mealId }: { date: string; mealId: string }) =>
      deleteMeal(date, mealId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-log", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-summary", variables.date] });
    },
  });
}

export function useToggleExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, exerciseName }: { date: string; exerciseName: string }) =>
      toggleExercise(date, exerciseName),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-log", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-summary", variables.date] });
    },
  });
}

export function useToggleMorningWalk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date }: { date: string }) => toggleMorningWalk(date),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-log", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-summary", variables.date] });
    },
  });
}

export function useToggleEveningWalk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date }: { date: string }) => toggleEveningWalk(date),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-log", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-summary", variables.date] });
    },
  });
}

export function useToggleFruit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date }: { date: string }) => toggleFruit(date),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-log", variables.date] });
    },
  });
}

export function useUpdateExerciseWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, exerciseName, weight }: { date: string; exerciseName: string; weight: number }) =>
      updateExerciseWeight(date, exerciseName, weight),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-log", variables.date] });
    },
  });
}

export function useUpdateWater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, bottles }: { date: string; bottles: number }) =>
      updateWater(date, bottles),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-log", variables.date] });
    },
  });
}

export function useAddMindEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, entry }: { date: string; entry: { blockId: string; blockTitle: string; category: string; plannedMinutes: number; description?: string } }) =>
      addMindEntry(date, entry),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mind-log", variables.date] });
    },
  });
}

export function useUpdateMindEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, entryId, update }: { date: string; entryId: string; update: Partial<MindLogEntry> }) =>
      updateMindEntry(date, entryId, update),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mind-log", variables.date] });
    },
  });
}

export function useStartMindTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, blockId }: { date: string; blockId: string }) =>
      startMindTimer(date, blockId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mind-log", variables.date] });
    },
  });
}

export function useStopMindTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date }: { date: string }) => stopMindTimer(date),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mind-log", variables.date] });
    },
  });
}

export function useToggleMinimumWinMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date }: { date: string }) => toggleMinimumWinMode(date),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mind-log", variables.date] });
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (update: UpdateUserProfile) => updateUserProfile(update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}

export function useExerciseHistory(exerciseName: string, enabled = true) {
  return useQuery({
    queryKey: ["exercise-history", exerciseName],
    queryFn: () => getExerciseHistory(exerciseName),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogSet(date: string) {
  const queryClient = useQueryClient();
  return useMutation<
    DailyLog,
    Error,
    { exerciseName: string; setIndex: number; entry: SetEntry },
    { previous?: DailyLog }
  >({
    // Serialize all set writes for the day so the read-modify-write of the
    // exercise_logs JSONB can't race and drop a set (last-write-wins).
    scope: { id: `logset-${date}` },
    mutationFn: ({ exerciseName, setIndex, entry }) =>
      upsertSet(date, exerciseName, setIndex, entry),
    onMutate: async ({ exerciseName, setIndex, entry }) => {
      await queryClient.cancelQueries({ queryKey: ["daily-log", date] });
      const previous = queryClient.getQueryData<DailyLog>(["daily-log", date]);
      if (previous) {
        const logs: Record<string, SetEntry[]> = { ...(previous.exercise_logs ?? {}) };
        const sets = [...(logs[exerciseName] ?? [])];
        sets[setIndex] = entry;
        logs[exerciseName] = sets;
        const anyDone = sets.some((s) => s && s.done);
        let completed = previous.completed_exercises;
        if (anyDone && !completed.includes(exerciseName)) completed = [...completed, exerciseName];
        else if (!anyDone && completed.includes(exerciseName)) completed = completed.filter((e) => e !== exerciseName);
        queryClient.setQueryData<DailyLog>(["daily-log", date], {
          ...previous,
          exercise_logs: logs,
          completed_exercises: completed,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["daily-log", date], context.previous);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["daily-log", date], data);
      queryClient.invalidateQueries({ queryKey: ["exercise-history"] });
    },
  });
}

export function useAddExertion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, exertion }: { date: string; exertion: InsertExertion }) =>
      addExertion(date, exertion),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-summary", variables.date] });
    },
  });
}

export function useDeleteExertion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, exertionId }: { date: string; exertionId: string }) =>
      deleteExertion(date, exertionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-summary", variables.date] });
    },
  });
}
