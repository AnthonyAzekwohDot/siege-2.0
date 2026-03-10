"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { DaySchedule } from "@/lib/types";
import { Dumbbell, Footprints } from "lucide-react";

interface WorkoutCardProps {
  schedule: DaySchedule;
  completedExercises: string[];
  exerciseWeights: Record<string, number>;
  morningWalkCompleted: boolean;
  eveningWalkCompleted: boolean;
  onToggleExercise: (name: string) => void;
  onToggleMorningWalk: () => void;
  onToggleEveningWalk: () => void;
  onUpdateWeight: (name: string, weight: number) => void;
  className?: string;
}

export function WorkoutCard({
  schedule,
  completedExercises,
  exerciseWeights,
  morningWalkCompleted,
  eveningWalkCompleted,
  onToggleExercise,
  onToggleMorningWalk,
  onToggleEveningWalk,
  onUpdateWeight,
  className,
}: WorkoutCardProps) {
  const totalExercises = schedule.exercises.length;
  const completedCount = completedExercises.length;

  if (schedule.isRestDay) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Dumbbell className="h-8 w-8 text-[hsl(var(--muted-foreground))] mb-2" />
          <p className="text-sm font-medium text-[hsl(var(--foreground))]">
            Rest Day
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Recovery is part of the process
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{schedule.focus}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {completedCount}/{totalExercises}
          </Badge>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {schedule.purpose}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Walks */}
        <div className="flex items-center gap-4">
          {schedule.morningWalk && (
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={morningWalkCompleted}
                onCheckedChange={onToggleMorningWalk}
              />
              <Footprints className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
              <span
                className={cn(
                  "text-sm",
                  morningWalkCompleted &&
                    "line-through text-[hsl(var(--muted-foreground))]"
                )}
              >
                AM Walk
              </span>
            </label>
          )}
          {schedule.eveningWalk && (
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={eveningWalkCompleted}
                onCheckedChange={onToggleEveningWalk}
              />
              <Footprints className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
              <span
                className={cn(
                  "text-sm",
                  eveningWalkCompleted &&
                    "line-through text-[hsl(var(--muted-foreground))]"
                )}
              >
                PM Walk
              </span>
            </label>
          )}
        </div>

        {/* Exercises */}
        <div className="space-y-2">
          {schedule.exercises.map((exercise) => {
            const isCompleted = completedExercises.includes(exercise.name);
            const currentWeight = exerciseWeights[exercise.name];

            return (
              <div
                key={exercise.name}
                className="flex items-center gap-3"
              >
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={() => onToggleExercise(exercise.name)}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      isCompleted &&
                        "line-through text-[hsl(var(--muted-foreground))]"
                    )}
                  >
                    {exercise.name}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {exercise.sets} x {exercise.reps}
                  </p>
                </div>
                <Input
                  type="number"
                  value={currentWeight ?? ""}
                  onChange={(e) => {
                    const w = parseFloat(e.target.value);
                    if (!isNaN(w)) onUpdateWeight(exercise.name, w);
                  }}
                  placeholder="kg"
                  className="w-16 h-8 text-xs text-center"
                  min={0}
                  max={500}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
