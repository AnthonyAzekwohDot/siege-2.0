"use client";

import { useEffect, useRef, useState } from "react";
import { joints, lerpPose, movementFor, groundYFor, type Movement, type Joints, type Point } from "@/lib/form-figure";

const VIEW_W = 110;
const VIEW_H = 140;

// Smootherstep, eases in and out, dwelling a beat at each end of the rep.
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function path(pts: [number, number][]): string {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
}

function Implement({ hand, kind }: { hand: [number, number]; kind: Movement["implement"] }) {
  if (kind === "none") return null;
  const [x, y] = hand;
  if (kind === "goblet") {
    return (
      <g className="fill-[hsl(var(--chart-2))]">
        <rect x={x - 5} y={y - 5.5} width={10} height={11} rx={2.4} />
      </g>
    );
  }
  if (kind === "dumbbellV") {
    // Neutral (hammer) grip — the dumbbell held vertical.
    return (
      <g className="fill-[hsl(var(--chart-2))] stroke-[hsl(var(--chart-2))]" strokeWidth={2.4} strokeLinecap="round">
        <line x1={x} y1={y - 6.5} x2={x} y2={y + 6.5} />
        <rect x={x - 4} y={y - 8.5} width={8} height={4} rx={1.4} stroke="none" />
        <rect x={x - 4} y={y + 4.5} width={8} height={4} rx={1.4} stroke="none" />
      </g>
    );
  }
  // Dumbbell, a short handle through the hand, a plate at each end.
  return (
    <g className="fill-[hsl(var(--chart-2))] stroke-[hsl(var(--chart-2))]" strokeWidth={2.4} strokeLinecap="round">
      <line x1={x - 6.5} y1={y} x2={x + 6.5} y2={y} />
      <rect x={x - 8.5} y={y - 4} width={4} height={8} rx={1.4} stroke="none" />
      <rect x={x + 4.5} y={y - 4} width={4} height={8} rx={1.4} stroke="none" />
    </g>
  );
}

// One limb chain drawn as an overlapping capsule (thick round-capped stroke).
// Same-fill capsules union into a solid athletic silhouette.
function Bone({ from, to, w, fill }: { from: Point; to: Point; w: number; fill: string }) {
  return (
    <line
      x1={from[0]}
      y1={from[1]}
      x2={to[0]}
      y2={to[1]}
      stroke={fill}
      strokeWidth={w}
      strokeLinecap="round"
    />
  );
}

// The solid body: overlapping capsules (torso barrel, tapered limbs) + head.
function Body({ j, fill, opacity = 1 }: { j: Joints; fill: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      {/* Legs, thigh thicker than shin, foot a stub */}
      <Bone from={j.hip} to={j.knee} w={12} fill={fill} />
      <Bone from={j.knee} to={j.ankle} w={8.5} fill={fill} />
      <Bone from={j.ankle} to={j.toe} w={7} fill={fill} />
      {/* Torso barrel + neck */}
      <Bone from={j.hip} to={j.shoulder} w={19} fill={fill} />
      <Bone from={j.shoulder} to={j.neckBase} w={9} fill={fill} />
      {/* Arm */}
      <Bone from={j.shoulder} to={j.elbow} w={8} fill={fill} />
      <Bone from={j.elbow} to={j.hand} w={6} fill={fill} />
      {/* Head */}
      <circle cx={j.head[0]} cy={j.head[1]} r={8.5} fill={fill} />
    </g>
  );
}

// Equipment drawn behind the figure — the main cue that tells two similar
// movements apart (bench, seat, box, step).
function Equipment({ mv, j, groundY }: { mv: Movement; j: Joints; groundY: number }) {
  const eq = mv.equipment ?? "none";
  const muted = "hsl(var(--muted-foreground))";
  if (eq === "none") return null;

  if (eq === "box") {
    return (
      <rect x={42} y={104} width={28} height={Math.max(6, groundY - 104)} rx={1.5}
        fill="none" strokeWidth={1.8} stroke={muted} />
    );
  }
  if (eq === "rearBox") {
    const rx = Math.min(j.ankleB[0], j.toeB[0]) - 3;
    const ry = Math.min(j.ankleB[1], j.toeB[1]) - 1;
    return (
      <rect x={rx} y={ry} width={17} height={Math.max(6, groundY - ry)} rx={1.5}
        fill="none" strokeWidth={1.8} stroke={muted} />
    );
  }
  if (eq === "stepBlock") {
    const bx = j.toe[0] - 12;
    const by = Math.min(j.toe[1], j.ankle[1]) + 1;
    return (
      <rect x={bx} y={by} width={20} height={Math.max(5, groundY - by)} rx={1.5}
        fill="none" strokeWidth={1.8} stroke={muted} />
    );
  }
  if (eq === "seat") {
    const sx = j.hip[0] - 17;
    const sw = 42;
    const sy = j.hip[1] + 3;
    return (
      <g stroke={muted} strokeWidth={1.8} strokeLinecap="round">
        <rect x={sx} y={sy} width={sw} height={4} rx={1} fill={muted} stroke="none" />
        <line x1={sx + 4} y1={sy + 4} x2={sx + 4} y2={groundY} />
        <line x1={sx + sw - 4} y1={sy + 4} x2={sx + sw - 4} y2={groundY} />
      </g>
    );
  }
  if (eq === "inclineBench") {
    // A bold diagonal pad the torso rests against, poking out past the body,
    // plus a support leg to the floor.
    const [hx, hy] = j.hip;
    const [sx, sy] = j.shoulder;
    const dx = sx - hx, dy = sy - hy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    let px = -uy, py = ux; // perpendicular, biased to the support (down) side
    if (py < 0) { px = -px; py = -py; }
    const off = 12;
    const aX = hx + px * off - ux * 14, aY = hy + py * off - uy * 14; // extend past the hips
    const bX = sx + px * off + ux * 16, bY = sy + py * off + uy * 16; // extend past the head
    return (
      <g stroke={muted} strokeLinecap="round" fill="none">
        <line x1={aX} y1={aY} x2={bX} y2={bY} strokeWidth={6} />
        <line x1={aX} y1={aY} x2={aX} y2={groundY} strokeWidth={2} />
        <line x1={bX} y1={bY} x2={bX} y2={groundY} strokeWidth={2} />
      </g>
    );
  }
  return null;
}

function Figure({ j, mv, groundY }: { j: Joints; mv: Movement; groundY: number }) {
  const split =
    mv.archetype === "lunge" ||
    mv.archetype === "splitSquat" ||
    mv.archetype === "stepUp" ||
    mv.archetype === "slRDL";
  const fg = "hsl(var(--foreground))";
  return (
    <g>
      {/* Ground / mat */}
      <line
        x1={mv.base === "floor" ? 18 : 8}
        y1={groundY}
        x2={mv.base === "floor" ? 98 : 102}
        y2={groundY}
        strokeWidth={1.4}
        strokeLinecap="round"
        className="stroke-[hsl(var(--border))]"
      />

      <Equipment mv={mv} j={j} groundY={groundY} />

      {/* Far (back) leg, behind the body, quieter */}
      {split && (
        <g opacity={0.32}>
          <Bone from={j.hip} to={j.kneeB} w={12} fill={fg} />
          <Bone from={j.kneeB} to={j.ankleB} w={8.5} fill={fg} />
          <Bone from={j.ankleB} to={j.toeB} w={7} fill={fg} />
        </g>
      )}

      {/* The solid athletic figure */}
      <Body j={j} fill={fg} />

      <Implement hand={j.hand} kind={mv.implement} />
    </g>
  );
}

/** Animated side-profile form figure for an exercise. Loops the rep. */
export function FormDiagram({
  movement,
  exerciseName,
  height = 176,
}: {
  movement?: Movement;
  exerciseName?: string;
  height?: number;
}) {
  const mv = movement ?? (exerciseName ? movementFor(exerciseName) : null);
  const [t, setT] = useState(1);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!mv) return;
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const period = (mv.period ?? 2.4) * 1000;

    const start = () => {
      // Begin one full sweep back from the working pose (t=1) so the first
      // painted frame matches useState(1) — no snap to the top pose on open.
      let t0: number | null = null;
      const tick = (now: number) => {
        if (t0 === null) t0 = now - period; // first tick lands at cycle=1 → raw=1
        const cycle = ((now - t0) / period) % 2; // 0..2 ping-pong
        const raw = cycle < 1 ? cycle : 2 - cycle;
        setT(ease(raw));
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    };

    const apply = () => {
      cancelAnimationFrame(raf.current);
      if (mql?.matches) setT(1); // hold the working position
      else start();
    };

    apply();
    mql?.addEventListener?.("change", apply);
    return () => {
      cancelAnimationFrame(raf.current);
      mql?.removeEventListener?.("change", apply);
    };
  }, [mv]);

  if (!mv) return null;
  const j = joints(lerpPose(mv.a, mv.b, t));
  const groundY = groundYFor(mv);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      style={{ height }}
      className="w-auto select-none"
      role="img"
      aria-label={`${exerciseName ?? "Exercise"} form demonstration`}
    >
      <Figure j={j} mv={mv} groundY={groundY} />
    </svg>
  );
}
