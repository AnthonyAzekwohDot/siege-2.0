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
} from "@/lib/queries";
import type { InsertMeal, InsertExertion, UpdateUserProfile, MindLogEntry } from "@/lib/types";

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
