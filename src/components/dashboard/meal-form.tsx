"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMealSchema, type InsertMeal } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MealFormProps {
  onSubmit: (meal: InsertMeal) => Promise<void>;
  isPending: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MealForm({
  onSubmit,
  isPending,
  open,
  onOpenChange,
}: MealFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InsertMeal>({
    resolver: zodResolver(insertMealSchema),
    defaultValues: {
      name: "",
      calories: undefined,
      source: "manual",
    },
  });

  const handleFormSubmit = async (data: InsertMeal) => {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Log a Meal</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 pt-4"
        >
          <div className="space-y-2">
            <label
              htmlFor="meal-name"
              className="text-sm font-medium text-[hsl(var(--foreground))]"
            >
              Meal Name
            </label>
            <Input
              id="meal-name"
              placeholder="e.g. Grilled chicken and rice"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="meal-calories"
              className="text-sm font-medium text-[hsl(var(--foreground))]"
            >
              Calories
            </label>
            <Input
              id="meal-calories"
              type="number"
              placeholder="e.g. 450"
              {...register("calories", { valueAsNumber: true })}
            />
            {errors.calories && (
              <p className="text-xs text-red-500">{errors.calories.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Logging..." : "Log Meal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
