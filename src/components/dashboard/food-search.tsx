"use client";

import * as React from "react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Search, Minus, Plus, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { findFood, calculateNutrition } from "@/lib/food-database";
import type { FoodEntry, PortionOption } from "@/lib/food-database";
import type { InsertMeal } from "@/lib/types";

interface FoodSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (meal: InsertMeal) => void;
  onCustomMeal?: () => void;
  recentMeals?: Array<{ name: string; calories: number }>;
}

export function FoodSearch({
  open,
  onOpenChange,
  onSubmit,
  onCustomMeal,
  recentMeals,
}: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [expandedFood, setExpandedFood] = useState<string | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<string | null>(null);
  const [servings, setServings] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to let dialog animation finish
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
    // Reset state when closing
    setQuery("");
    setExpandedFood(null);
    setSelectedPortion(null);
    setServings(1);
  }, [open]);

  // Search results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return findFood(query);
  }, [query]);

  // Deduplicated recent meals (by name, most recent first, max 5)
  const recentList = useMemo(() => {
    if (!recentMeals || recentMeals.length === 0) return [];
    const seen = new Set<string>();
    const deduped: Array<{ name: string; calories: number }> = [];
    for (const meal of [...recentMeals].reverse()) {
      const key = meal.name.toLowerCase();
      if (!seen.has(key) && deduped.length < 5) {
        seen.add(key);
        deduped.push(meal);
      }
    }
    return deduped;
  }, [recentMeals]);

  const handleSelectFood = useCallback(
    (food: FoodEntry) => {
      if (expandedFood === food.name) {
        setExpandedFood(null);
        setSelectedPortion(null);
        setServings(1);
      } else {
        setExpandedFood(food.name);
        setSelectedPortion(null);
        setServings(1);
      }
    },
    [expandedFood]
  );

  const handleLogPortion = useCallback(
    (food: FoodEntry, portion: PortionOption) => {
      const nutrition = calculateNutrition(food, portion.grams);
      onSubmit({
        name: food.name,
        calories: Math.round(nutrition.calories * servings),
        source: "manual",
        proteinG: Math.round(nutrition.proteinG * servings * 10) / 10,
        carbsG: Math.round(nutrition.carbsG * servings * 10) / 10,
        fatG: Math.round(nutrition.fatG * servings * 10) / 10,
      });
      onOpenChange(false);
    },
    [servings, onSubmit, onOpenChange]
  );

  const handleLogRecent = useCallback(
    (meal: { name: string; calories: number }) => {
      onSubmit({
        name: meal.name,
        calories: meal.calories,
        source: "manual",
      });
      onOpenChange(false);
    },
    [onSubmit, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="sm:max-h-[85vh] max-h-[90vh]"
      >
        <DialogHeader>
          <DialogTitle>Log Food</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods..."
            aria-label="Search foods"
            className="pl-9"
          />
        </div>

        {/* Results area */}
        <div className="mt-3 space-y-2 max-h-[55vh] overflow-y-auto -mx-1 px-1">
          {/* Recent meals when search is empty */}
          {!query.trim() && recentList.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
                Recent
              </p>
              <div className="space-y-1.5">
                {recentList.map((meal, i) => (
                  <button
                    key={`${meal.name}-${i}`}
                    onClick={() => handleLogRecent(meal)}
                    className="w-full glass-card p-3 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {meal.name}
                      </span>
                      <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                        {meal.calories} cal
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {query.trim() && results.length === 0 && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">
              No foods found for &ldquo;{query}&rdquo;
            </p>
          )}

          {results.map((food) => {
            const isExpanded = expandedFood === food.name;
            const defaultNutrition = calculateNutrition(food);

            return (
              <div key={food.name} className="glass-card overflow-hidden">
                {/* Food card header */}
                <button
                  onClick={() => handleSelectFood(food)}
                  className="w-full p-3.5 text-left active:bg-[rgba(0,0,0,0.02)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {food.name}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {defaultNutrition.calories} cal
                        {" · "}
                        {food.defaultPortionUnit}
                      </p>
                    </div>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] capitalize">
                      {food.category.replace("_", " ")}
                    </span>
                  </div>
                </button>

                {/* Expanded portion selector */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 space-y-3 border-t border-[hsl(var(--border))]">
                    {/* Serving counter */}
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                        Servings
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            setServings((s) => Math.max(1, s - 1))
                          }
                          aria-label="Fewer servings"
                          className="flex h-11 w-11 items-center justify-center rounded-full active:bg-[rgba(0,0,0,0.06)] transition-colors"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(0,0,0,0.04)]"><Minus className="w-3.5 h-3.5 text-[hsl(var(--foreground))]" /></span>
                        </button>
                        <span className="text-sm font-bold text-[hsl(var(--foreground))] min-w-[2ch] text-center">
                          {servings}x
                        </span>
                        <button
                          onClick={() => setServings((s) => s + 1)}
                          aria-label="More servings"
                          className="flex h-11 w-11 items-center justify-center rounded-full active:bg-[rgba(0,0,0,0.06)] transition-colors"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(0,0,0,0.04)]"><Plus className="w-3.5 h-3.5 text-[hsl(var(--foreground))]" /></span>
                        </button>
                      </div>
                    </div>

                    {/* Portion pills */}
                    <div className="flex flex-wrap gap-2">
                      {food.portionOptions.map((portion) => {
                        const isSelected = selectedPortion === portion.label;
                        const nutrition = calculateNutrition(
                          food,
                          portion.grams
                        );
                        const displayCal = Math.round(
                          nutrition.calories * servings
                        );

                        return (
                          <button
                            key={portion.label}
                            onClick={() => {
                              setSelectedPortion(portion.label);
                              handleLogPortion(food, portion);
                            }}
                            className={`min-h-[44px] px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              isSelected
                                ? "bg-[hsl(var(--chart-3))] text-white"
                                : "bg-[rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.08)]"
                            }`}
                          >
                            {portion.label} · {displayCal} cal
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom meal link */}
        {onCustomMeal && (
          <button
            onClick={() => {
              onOpenChange(false);
              onCustomMeal();
            }}
            className="flex items-center justify-center gap-2 w-full mt-3 min-h-[44px] py-2.5 text-sm font-medium text-[hsl(var(--primary))] active:opacity-70 transition-opacity"
          >
            <PenLine className="w-3.5 h-3.5" />
            Custom meal
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
