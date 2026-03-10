"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import type { DailyLog } from "@/lib/types";
import { Activity, Utensils, Dumbbell, Droplets } from "lucide-react";

interface DailyScoreProps {
  log: DailyLog | undefined;
  date: Date;
  className?: string;
}

export function DailyScore({ log, date, className }: DailyScoreProps) {
  const totalCalories = log?.meals.reduce((sum, m) => sum + m.calories, 0) ?? 0;
  const calorieGoal = log?.calories_goal ?? 0;
  const steps = log?.steps ?? 0;
  const stepsGoal = log?.steps_goal ?? 10000;
  const workoutDone = (log?.completed_exercises?.length ?? 0) > 0;
  const waterBottles = log?.water_bottles ?? 0;
  const waterGoal = log?.water_goal ?? 7;

  const items = [
    {
      icon: Utensils,
      label: "Calories",
      value: `${totalCalories} / ${calorieGoal}`,
      status: calorieGoal > 0 && totalCalories <= calorieGoal ? "good" : totalCalories > calorieGoal ? "bad" : "neutral",
    },
    {
      icon: Activity,
      label: "Steps",
      value: `${steps.toLocaleString()} / ${stepsGoal.toLocaleString()}`,
      status: steps >= stepsGoal ? "good" : steps >= stepsGoal * 0.5 ? "neutral" : "bad",
    },
    {
      icon: Dumbbell,
      label: "Workout",
      value: workoutDone ? "Done" : "Pending",
      status: workoutDone ? "good" : "neutral",
    },
    {
      icon: Droplets,
      label: "Water",
      value: `${waterBottles} / ${waterGoal}`,
      status: waterBottles >= waterGoal ? "good" : waterBottles >= waterGoal * 0.5 ? "neutral" : "bad",
    },
  ] as const;

  const statusColor = {
    good: "bg-green-500",
    neutral: "bg-yellow-500",
    bad: "bg-red-500",
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Daily Score
        </h3>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {format(date, "EEE, MMM d")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map(({ icon: Icon, label, value, status }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                statusColor[status]
              )}
            />
            <Icon className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
            <div className="min-w-0">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {label}
              </p>
              <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
