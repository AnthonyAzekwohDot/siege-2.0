"use client";

import { cn } from "@/lib/utils";

interface StepRingProps {
  current: number;
  goal: number;
  className?: string;
}

export function StepRing({ current, goal, className }: StepRingProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const radius = 80;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 100) return "hsl(145, 60%, 42%)";
    if (percentage >= 50) return "hsl(var(--primary))";
    return "hsl(var(--chart-4))";
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-32 h-32 sm:w-48 sm:h-48",
        className
      )}
    >
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 192 192"
      >
        {/* Background circle */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[hsl(var(--foreground))]">
          {current.toLocaleString()}
        </span>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">
          / {goal.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
