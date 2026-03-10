"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

interface Insight {
  message: string;
  action: string;
  actionLabel: string;
}

interface InsightCardProps {
  insight: Insight | null;
  onAction: (action: string) => void;
  className?: string;
}

export function InsightCard({ insight, onAction, className }: InsightCardProps) {
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    setDismissed(false);
  }, [insight]);

  if (!insight || dismissed) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card className={cn("p-4 relative", className)}>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <Sparkles className="h-5 w-5 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="text-sm text-[hsl(var(--foreground))]">
              {insight.message}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(insight.action)}
            >
              {insight.actionLabel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
