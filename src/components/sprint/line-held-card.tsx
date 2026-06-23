"use client";

import { Flame, Shield } from "lucide-react";
import type { LineHeld, StreakState } from "@/lib/adherence";

interface LineHeldCardProps {
  lineHeld: LineHeld;
  streak: StreakState;
}

/** The unified daily verdict: body + mind on one card, with the Hold-the-Line
 *  streak and freeze tokens. Today is in-progress, so it reads HELD or IN PLAY,
 *  never BROKEN. */
export function LineHeldCard({ lineHeld, streak }: LineHeldCardProps) {
  const { lines, held, bodyHeld, mindHeld } = lineHeld;

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Line Held
        </h3>
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide ${
            held
              ? "bg-[hsl(var(--chart-3))/0.15] text-[hsl(var(--chart-3))]"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          {held ? "HELD" : "IN PLAY"}
        </span>
      </div>

      {/* Streak + freeze tokens */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-baseline gap-1.5">
          <Flame
            className={`w-5 h-5 self-center ${
              streak.streak > 0 ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
            }`}
          />
          <span className="text-3xl font-bold text-[hsl(var(--foreground))]">{streak.streak}</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            day{streak.streak === 1 ? "" : "s"} held
          </span>
        </div>
        {streak.tokens > 0 && (
          <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
            {Array.from({ length: streak.tokens }).map((_, i) => (
              <Shield key={i} className="w-4 h-4 text-[hsl(var(--chart-4))]" />
            ))}
            <span className="text-xs ml-0.5">freeze{streak.tokens === 1 ? "" : "s"}</span>
          </div>
        )}
      </div>

      {/* Body / Mind halves */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {[
          { label: "Body", on: bodyHeld },
          { label: "Mind", on: mindHeld },
        ].map((half) => (
          <div
            key={half.label}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold ${
              half.on
                ? "bg-[hsl(var(--chart-3))/0.12] text-[hsl(var(--chart-3))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
            }`}
          >
            {half.label}
            <span className="text-xs font-medium">{half.on ? "held" : "open"}</span>
          </div>
        ))}
      </div>

      {/* Line breakdown */}
      <div className="grid grid-cols-1 gap-y-2 mt-3">
        {lines.map((line) => (
          <div key={line.key} className="flex items-center gap-2.5">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                line.na
                  ? "bg-[hsl(var(--muted-foreground))/0.4]"
                  : line.held
                  ? "bg-[hsl(var(--chart-3))]"
                  : "bg-[hsl(var(--muted-foreground))/0.5]"
              }`}
            />
            <span className="text-xs font-medium text-[hsl(var(--foreground))]">{line.label}</span>
            <span className="text-xs text-[hsl(var(--muted-foreground))] ml-auto truncate">
              {line.detail}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
