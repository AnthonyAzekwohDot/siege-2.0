"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StepInputProps {
  currentSteps: number;
  onSubmit: (steps: number) => void;
  onCancel?: () => void;
  isPending: boolean;
  className?: string;
}

export function StepInput({
  currentSteps,
  onSubmit,
  onCancel,
  isPending,
  className,
}: StepInputProps) {
  const [value, setValue] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const steps = parseInt(value, 10);
    if (!isNaN(steps) && steps >= 0) {
      onSubmit(steps);
      setValue("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex items-center gap-2", className)}
    >
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={currentSteps.toLocaleString()}
        min={0}
        max={100000}
        className="w-32"
      />
      <Button type="submit" size="sm" disabled={isPending || !value}>
        {isPending ? "..." : "Update"}
      </Button>
      {onCancel && (
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </form>
  );
}
