"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Check, X } from "lucide-react";

interface StepInputProps {
  currentSteps: number;
  onSubmit: (steps: number) => void;
  onCancel?: () => void;
  isPending: boolean;
  className?: string;
}

const QUICK_ADD = [1000, 2500, 5000];

export function StepInput({
  currentSteps,
  onSubmit,
  onCancel,
  isPending,
  className,
}: StepInputProps) {
  const [value, setValue] = React.useState(currentSteps);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value >= 0) {
      onSubmit(value);
    }
  };

  const adjust = (amount: number) => {
    setValue((prev) => Math.max(0, prev + amount));
  };

  return (
    <div className={cn("glass-card p-5 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
          Update Steps
        </span>
        {onCancel && (
          <button onClick={onCancel} className="p-1.5 rounded-full active:bg-[rgba(0,0,0,0.04)]">
            <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main counter */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => adjust(-500)}
            className="w-11 h-11 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center active:bg-[rgba(0,0,0,0.1)] transition-colors"
          >
            <Minus className="h-5 w-5 text-[hsl(var(--foreground))]" />
          </button>

          <input
            ref={inputRef}
            type="number"
            value={value}
            onChange={(e) => setValue(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-32 text-center text-3xl font-bold bg-transparent outline-none text-[hsl(var(--foreground))] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            type="button"
            onClick={() => adjust(500)}
            className="w-11 h-11 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center active:bg-[rgba(0,0,0,0.1)] transition-colors"
          >
            <Plus className="h-5 w-5 text-[hsl(var(--foreground))]" />
          </button>
        </div>

        {/* Quick add buttons */}
        <div className="flex justify-center gap-2 mt-3">
          {QUICK_ADD.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => adjust(amount)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[rgba(0,0,0,0.04)] text-[hsl(var(--muted-foreground))] active:bg-[rgba(0,0,0,0.08)] transition-colors"
            >
              +{amount.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Confirm */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full mt-4 gap-2"
        >
          <Check className="h-4 w-4" />
          {isPending ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  );
}
