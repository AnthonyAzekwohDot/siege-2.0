"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Droplets } from "lucide-react";

interface WaterTrackerProps {
  bottles: number;
  goal: number;
  onUpdate: (bottles: number) => void;
  isPending: boolean;
  className?: string;
}

export function WaterTracker({
  bottles,
  goal,
  onUpdate,
  isPending,
  className,
}: WaterTrackerProps) {
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = () => {
    if (isPending) return;
    if (bottles < goal) {
      onUpdate(bottles + 1);
    }
  };

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      if (!isPending && bottles > 0) {
        onUpdate(bottles - 1);
      }
      longPressTimer.current = null;
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      handleTap();
    }
  };

  const percentage = Math.min((bottles / goal) * 100, 100);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
          Water
        </span>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">
          {bottles} / {goal}
        </span>
      </div>

      {/* Bottle row */}
      <div
        className="flex items-center gap-1.5 cursor-pointer select-none"
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={() => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }}
        onTouchStart={handleLongPressStart}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleLongPressEnd();
        }}
      >
        {Array.from({ length: goal }).map((_, i) => (
          <Droplets
            key={i}
            className={cn(
              "h-6 w-6 transition-colors duration-200",
              i < bottles
                ? "text-blue-500 fill-blue-500"
                : "text-[hsl(var(--muted))]"
            )}
          />
        ))}
      </div>

      {/* Progress indicator */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
