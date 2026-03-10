"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CalorieBarProps {
  consumed: number;
  goal: number;
  fruitEaten: boolean;
  className?: string;
}

export function CalorieBar({
  consumed,
  goal,
  fruitEaten,
  className,
}: CalorieBarProps) {
  const percentage = goal > 0 ? (consumed / goal) * 100 : 0;

  const getBarColor = () => {
    if (percentage > 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTextColor = () => {
    if (percentage > 100) return "text-red-500";
    if (percentage >= 80) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium", getTextColor())}>
            {consumed}
          </span>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            / {goal} kcal
          </span>
        </div>
        {fruitEaten && (
          <Badge variant="secondary" className="text-xs">
            Fruit
          </Badge>
        )}
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getBarColor()
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
