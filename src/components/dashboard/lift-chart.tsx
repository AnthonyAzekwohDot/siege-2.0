"use client";

import type { LiftPoint } from "@/lib/overload";

/** Compact trend for a single lift — est-1RM for loaded lifts, top reps for
 *  bodyweight. */
export function LiftChart({ points, bodyweight = false }: { points: LiftPoint[]; bodyweight?: boolean }) {
  const valOf = (p: LiftPoint) => (bodyweight ? p.topReps : p.topE1RM);
  const unit = bodyweight ? "reps" : "kg e1RM";
  const pts = points.filter((p) => valOf(p) > 0);

  if (pts.length < 2) {
    return (
      <p className="py-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
        Log 2+ sessions to see your trend.
      </p>
    );
  }

  const vals = pts.map(valOf);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 100, H = 56, pad = 6;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  const coords = pts.map((p, i) => ({
    x: pad + (i / (pts.length - 1)) * innerW,
    y: pad + innerH - ((valOf(p) - min) / range) * innerH,
  }));
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const up = vals[vals.length - 1] >= vals[0];
  const stroke = up ? "hsl(var(--chart-3))" : "hsl(var(--destructive))";

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "56px" }} preserveAspectRatio="none">
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={pad}
            x2={W - pad}
            y1={pad + innerH - f * innerH}
            y2={pad + innerH - f * innerH}
            stroke="hsl(var(--border))"
            strokeWidth="0.3"
          />
        ))}
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="1.4" fill={stroke} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
        <span>
          {min.toFixed(bodyweight ? 0 : 1)} {unit}
        </span>
        <span className={up ? "text-[hsl(var(--chart-3))]" : "text-[hsl(var(--destructive))]"}>
          {up ? "↑" : "↓"} {max.toFixed(bodyweight ? 0 : 1)} {unit}
        </span>
      </div>
    </div>
  );
}
