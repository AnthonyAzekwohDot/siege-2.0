"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { PhotoAnalysis, DetectedFoodItem } from "@/lib/types";
import { Camera, Check, AlertCircle } from "lucide-react";

interface FoodReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: PhotoAnalysis | null;
  suggestedMealName: string;
  suggestedMealType: string;
  clarificationNeeded: {
    question: string;
    options: string[];
  } | null;
  onConfirm: (items: DetectedFoodItem[], totalCalories: number) => void;
  onRetake: () => void;
}

export function FoodReviewSheet({
  open,
  onOpenChange,
  analysis,
  suggestedMealName,
  suggestedMealType,
  clarificationNeeded,
  onConfirm,
  onRetake,
}: FoodReviewSheetProps) {
  const [editedItems, setEditedItems] = React.useState<DetectedFoodItem[]>([]);

  React.useEffect(() => {
    if (analysis?.detectedItems) {
      setEditedItems([...analysis.detectedItems]);
    }
  }, [analysis]);

  const totalCalories = editedItems.reduce(
    (sum, item) => sum + item.calories,
    0
  );

  const updateItemCalories = (index: number, calories: number) => {
    setEditedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], calories, userEdited: true };
      return next;
    });
  };

  const updateItemName = (index: number, name: string) => {
    setEditedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name, userEdited: true };
      return next;
    });
  };

  const updateItemPortion = (index: number, portionValue: number) => {
    setEditedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], portionValue, userEdited: true };
      return next;
    });
  };

  if (!analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {suggestedMealName || "Food Analysis"}
          </DialogTitle>
          {suggestedMealType && (
            <Badge variant="secondary" className="w-fit">
              {suggestedMealType}
            </Badge>
          )}
        </DialogHeader>

        {/* Clarification */}
        {clarificationNeeded && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-sm text-[hsl(var(--foreground))]">
                {clarificationNeeded.question}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-6">
              {clarificationNeeded.options.map((option) => (
                <Badge
                  key={option}
                  variant="outline"
                  className="cursor-pointer hover:bg-[hsl(var(--accent))]"
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Detected items */}
        <div className="space-y-3 pt-2">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
            Detected items
          </p>

          {editedItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--accent))]/50"
            >
              <div className="flex-1 space-y-1.5">
                <Input
                  value={item.name}
                  onChange={(e) => updateItemName(index, e.target.value)}
                  className="h-7 text-sm font-medium border-none bg-transparent p-0 focus-visible:ring-0"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={item.portionValue}
                    onChange={(e) =>
                      updateItemPortion(index, parseFloat(e.target.value) || 0)
                    }
                    className="h-6 w-16 text-xs border-none bg-transparent p-0 focus-visible:ring-0"
                  />
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {item.portionUnit}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <Input
                  type="number"
                  value={item.calories}
                  onChange={(e) =>
                    updateItemCalories(index, parseInt(e.target.value, 10) || 0)
                  }
                  className="h-8 w-20 text-sm font-semibold text-right border-none bg-transparent p-0 focus-visible:ring-0"
                />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  kcal
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border))]">
          <span className="text-sm font-medium text-[hsl(var(--foreground))]">
            Total
          </span>
          <span className="text-lg font-bold text-[hsl(var(--foreground))]">
            {totalCalories} kcal
          </span>
        </div>

        {/* Quality score */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Confidence:
          </span>
          <Badge
            variant={
              analysis.estimationQualityScore >= 0.7
                ? "default"
                : "secondary"
            }
            className="text-xs"
          >
            {Math.round(analysis.estimationQualityScore * 100)}%
          </Badge>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onRetake}>
            Retake
          </Button>
          <Button onClick={() => onConfirm(editedItems, totalCalories)} className="gap-1.5">
            <Check className="h-4 w-4" />
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
