"use client";

import { FRONT_MUSCLES, BACK_MUSCLES } from "@/lib/muscle-map-data";

// Map the schedule's muscle-group vocabulary onto the diagram's muscle keys.
const GROUP_TO_KEYS: Record<string, string[]> = {
  quads: ["QUADRICEPS"],
  glutes: ["GLUTEAL"],
  hamstrings: ["HAMSTRING"],
  calves: ["CALVES", "LEFT_SOLEUS", "RIGHT_SOLEUS"],
  soleus: ["LEFT_SOLEUS", "RIGHT_SOLEUS", "CALVES"],
  core: ["ABS"],
  "deep abs": ["ABS"],
  abs: ["ABS"],
  obliques: ["OBLIQUES"],
  lats: ["UPPER_BACK"],
  rhomboids: ["UPPER_BACK"],
  "mid-back": ["UPPER_BACK"],
  traps: ["TRAPEZIUS"],
  "rear delts": ["BACK_DELTOIDS"],
  shoulders: ["FRONT_DELTOIDS", "BACK_DELTOIDS"],
  "lateral delts": ["FRONT_DELTOIDS", "BACK_DELTOIDS"],
  chest: ["CHEST"],
  "upper chest": ["CHEST"],
  biceps: ["BICEPS"],
  triceps: ["TRICEPS"],
  forearms: ["FOREARM"],
  "lower back": ["LOWER_BACK"],
};

export function musclesToKeys(groups: string[] | undefined): Set<string> {
  const s = new Set<string>();
  for (const g of groups ?? []) for (const k of GROUP_TO_KEYS[g.toLowerCase()] ?? []) s.add(k);
  return s;
}

function BodyView({
  muscles,
  worked,
  label,
}: {
  muscles: Record<string, string[]>;
  worked: Set<string>;
  label: string;
}) {
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 100 200"
        className="w-auto"
        style={{ height: 168 }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`${label} view, worked muscles highlighted`}
      >
        {Object.entries(muscles).flatMap(([key, polys]) =>
          polys.map((pts, i) => (
            <polygon
              key={`${key}-${i}`}
              points={pts}
              fill={worked.has(key) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.16)"}
              stroke="hsl(var(--card))"
              strokeWidth="0.4"
            />
          ))
        )}
      </svg>
      <figcaption className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        {label}
      </figcaption>
    </figure>
  );
}

/** Front + back body diagram with the exercise's worked muscles in the accent. */
export function MuscleMap({ worked }: { worked: Set<string> }) {
  return (
    <div className="flex items-end justify-center gap-6 py-1">
      <BodyView muscles={FRONT_MUSCLES} worked={worked} label="Front" />
      <BodyView muscles={BACK_MUSCLES} worked={worked} label="Back" />
    </div>
  );
}
