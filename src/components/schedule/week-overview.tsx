"use client";

import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK, type DayOfWeek } from "@/lib/types";

interface WeekOverviewProps {
  currentDay: DayOfWeek;
  completedDays: DayOfWeek[];
  onSelectDay: (day: DayOfWeek) => void;
  className?: string;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "M",
  tuesday: "T",
  wednesday: "W",
  thursday: "T",
  friday: "F",
  saturday: "S",
  sunday: "S",
};

export function WeekOverview({
  currentDay,
  completedDays,
  onSelectDay,
  className,
}: WeekOverviewProps) {
  return (
    <div className={cn("flex items-center justify-between gap-1", className)}>
      {DAYS_OF_WEEK.map((day) => {
        const isSelected = day === currentDay;
        const isCompleted = completedDays.includes(day);

        return (
          <button
            key={day}
            onClick={() => onSelectDay(day)}
            className={cn(
              "relative flex flex-col items-center justify-center w-10 h-12 rounded-xl text-sm font-medium transition-all",
              isSelected
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md"
                : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
            )}
          >
            <span className="text-xs">{DAY_LABELS[day]}</span>
            {isCompleted && (
              <span
                className={cn(
                  "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                  isSelected ? "bg-white" : "bg-green-500"
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
