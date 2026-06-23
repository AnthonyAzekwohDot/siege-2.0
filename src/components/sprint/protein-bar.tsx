"use client";

interface ProteinBarProps {
  consumed: number;
  floor: number;
}

/** Daily protein floor tracker. Green once the floor is met; the floor is a
 *  minimum to hold muscle through the cut, not a ceiling. */
export function ProteinBar({ consumed, floor }: ProteinBarProps) {
  const pct = floor > 0 ? Math.min(100, (consumed / floor) * 100) : 0;
  const met = floor > 0 && consumed >= floor;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
          Protein floor
        </span>
        <span
          className={`text-xs font-semibold tabular-nums shrink-0 ${
            met ? "text-[hsl(var(--chart-3))]" : "text-[hsl(var(--foreground))]"
          }`}
        >
          {consumed} / {floor}g
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            met ? "bg-[hsl(var(--chart-3))]" : "bg-[hsl(var(--primary))]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!met && consumed < floor && (
        <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
          {floor - consumed}g to hit the floor
        </p>
      )}
    </div>
  );
}
