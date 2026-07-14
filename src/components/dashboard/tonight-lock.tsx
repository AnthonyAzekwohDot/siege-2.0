"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Utensils } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as queries from "@/lib/queries";
import { calculateDailyBudget } from "@/lib/calculations";
import type { InsertMeal } from "@/lib/types";

export function TonightLock() {
  const [open, setOpen] = React.useState(false);
  const dismissedRef = React.useRef(false);
  const queryClient = useQueryClient();
  const dateKey = format(new Date(), "yyyy-MM-dd");

  // Close for good: mark it shown for today so the parent gate stops re-rendering
  // it, and never auto-reopen this mount.
  const handleClose = React.useCallback(() => {
    dismissedRef.current = true;
    setOpen(false);
    queries
      .markTonightLockShown(dateKey)
      .finally(() => queryClient.invalidateQueries({ queryKey: ["tonight-lock", dateKey] }));
  }, [dateKey, queryClient]);

  const { data: dailyLog } = useQuery({
    queryKey: ["daily-log", dateKey],
    queryFn: () => queries.getOrCreateDailyLog(dateKey),
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => queries.getUserProfile(),
  });

  const { data: nutritionSummary } = useQuery({
    queryKey: ["nutrition-summary", dateKey],
    queryFn: () => queries.getOrCreateNutritionSummary(dateKey),
  });

  const derived = React.useMemo(() => {
    if (!dailyLog || !userProfile || !nutritionSummary) return null;

    // One source of truth: the day's frozen TDEE snapshot, shared with the
    // nutrition page and the cron, so every surface quotes the same number.
    const budget = calculateDailyBudget(nutritionSummary.tdee_snapshot, nutritionSummary.deficit_target_snapshot);
    const totalEaten = dailyLog.meals.reduce((s, m) => s + m.calories, 0);
    const remaining = budget - totalEaten;

    return {
      remainingCalories: remaining,
      inDeficit: remaining > 0,
      safeMeals: userProfile.safe_meals ?? [],
    };
  }, [dailyLog, userProfile, nutritionSummary]);

  const addMealMutation = useMutation({
    mutationFn: (meal: InsertMeal) => queries.addMeal(dateKey, meal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-log", dateKey] });
    },
  });

  // Open once when the data is ready. The parent only renders this component at
  // the user's configured lock time (and only if not already shown today), so no
  // hardcoded hour check here — and once dismissed it never springs back open.
  React.useEffect(() => {
    if (derived && !dismissedRef.current) setOpen(true);
  }, [derived]);

  if (!derived) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent onClose={handleClose}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-[hsl(var(--primary))]" />
            <DialogTitle>Tonight Check-in</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
              {derived.remainingCalories}
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              calories remaining
            </p>
            {derived.inDeficit ? (
              <Badge className="bg-green-500 text-white">On track</Badge>
            ) : (
              <Badge variant="destructive">Over budget</Badge>
            )}
          </div>

          {derived.safeMeals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide flex items-center gap-1.5">
                <Utensils className="h-3 w-3" />
                Safe meals
              </p>
              <div className="flex flex-wrap gap-2">
                {derived.safeMeals.map((meal) => (
                  <Button
                    key={meal.id}
                    variant="outline"
                    size="sm"
                    disabled={addMealMutation.isPending}
                    onClick={() =>
                      addMealMutation.mutate({
                        name: meal.name,
                        calories: meal.calories,
                        source: "manual",
                      })
                    }
                  >
                    {meal.name} ({meal.calories})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* "Quick walks" preset buttons removed: they were non-functional, and
              wiring them to add calories back would reintroduce the Phase 0
              double-count (budget = TDEE − deficit; walks are not added back). */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
