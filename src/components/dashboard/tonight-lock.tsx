"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Utensils, Footprints } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface TonightLockMeal {
  id: string;
  name: string;
  calories: number;
}

interface TonightLockWalk {
  id: string;
  name: string;
  calories: number;
}

interface TonightLockData {
  remainingCalories: number;
  inDeficit: boolean;
  safeMeals: TonightLockMeal[];
  walkPresets: TonightLockWalk[];
  locked: boolean;
}

export function TonightLock() {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery<TonightLockData>({
    queryKey: ["tonight-lock"],
    queryFn: async () => {
      const res = await fetch("/api/tonight-lock");
      if (!res.ok) throw new Error("Failed to fetch tonight lock data");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const logMealMutation = useMutation({
    mutationFn: async (meal: TonightLockMeal) => {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: meal.name,
          calories: meal.calories,
          source: "manual",
        }),
      });
      if (!res.ok) throw new Error("Failed to log meal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tonight-lock"] });
      queryClient.invalidateQueries({ queryKey: ["daily-log"] });
    },
  });

  const logWalkMutation = useMutation({
    mutationFn: async (walk: TonightLockWalk) => {
      const res = await fetch("/api/exertions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: walk.name,
          calories: walk.calories,
        }),
      });
      if (!res.ok) throw new Error("Failed to log walk");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tonight-lock"] });
      queryClient.invalidateQueries({ queryKey: ["daily-log"] });
    },
  });

  // Auto-show after 8pm
  React.useEffect(() => {
    const check = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 20 && data && !data.locked) {
        setOpen(true);
      }
    };
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [data]);

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent onClose={() => setOpen(false)}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-[hsl(var(--primary))]" />
            <DialogTitle>Tonight Check-in</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Remaining calories */}
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
              {data.remainingCalories}
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              calories remaining
            </p>
            {data.inDeficit ? (
              <Badge className="bg-green-500 text-white">On track</Badge>
            ) : (
              <Badge variant="destructive">Over budget</Badge>
            )}
          </div>

          {/* Safe meals */}
          {data.safeMeals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide flex items-center gap-1.5">
                <Utensils className="h-3 w-3" />
                Safe meals
              </p>
              <div className="flex flex-wrap gap-2">
                {data.safeMeals.map((meal) => (
                  <Button
                    key={meal.id}
                    variant="outline"
                    size="sm"
                    disabled={logMealMutation.isPending}
                    onClick={() => logMealMutation.mutate(meal)}
                  >
                    {meal.name} ({meal.calories})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Walk presets */}
          {data.walkPresets.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide flex items-center gap-1.5">
                <Footprints className="h-3 w-3" />
                Quick walks
              </p>
              <div className="flex flex-wrap gap-2">
                {data.walkPresets.map((walk) => (
                  <Button
                    key={walk.id}
                    variant="outline"
                    size="sm"
                    disabled={logWalkMutation.isPending}
                    onClick={() => logWalkMutation.mutate(walk)}
                  >
                    {walk.name} (-{walk.calories} cal)
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
