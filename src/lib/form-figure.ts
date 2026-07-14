// The form-figure engine: a side-profile line skeleton driven by forward
// kinematics, animated between two keyframe poses per movement archetype.
// The figure sinks in a squat, hinges in an RDL, arcs in a curl, locks out in
// a press. Pure geometry, no assets, infinitely crisp, tiny.
//
// Angles are absolute, in degrees, screen space (y points DOWN):
//   0 = east (forward, the figure faces right), 90 = south (down),
//   -90 = north (up), 180 = west (back).

export type Point = [number, number];

export type Archetype =
  | "squat"
  | "hinge"
  | "slRDL"
  | "lunge"
  | "splitSquat"
  | "stepUp"
  | "calfStand"
  | "calfSeat"
  | "rowOneArm"
  | "rowChest"
  | "pressOverhead"
  | "pressSeated"
  | "pressFloor"
  | "pressIncline"
  | "pushup"
  | "lateralRaise"
  | "rearFly"
  | "curl"
  | "hammerCurl"
  | "tricepsExt"
  | "deadBug"
  | "hollow"
  | "plank";

/** What the hands hold, draws at the wrist. dumbbellV = neutral (hammer) grip. */
export type Implement = "none" | "dumbbell" | "dumbbellV" | "goblet";

/** Equipment drawn behind the figure to disambiguate the movement. */
export type Equipment = "none" | "seat" | "inclineBench" | "box" | "stepBlock" | "rearBox";

export interface Pose {
  hip: Point;
  torso: number; // hip -> shoulder
  upperArm: number; // shoulder -> elbow
  foreArm: number; // elbow -> hand
  thigh: number; // hip -> knee
  shin: number; // knee -> ankle
  foot: number; // ankle -> toe
  /** Optional back leg (split stance). Falls back to the front leg. */
  thighB?: number;
  shinB?: number;
  footB?: number;
}

export interface Movement {
  archetype: Archetype;
  a: Pose; // start / top
  b: Pose; // end / working position
  implement: Implement;
  /** Where the figure rests: "stand" | "floor". Controls the ground/mat. */
  base: "stand" | "floor";
  /** Equipment drawn behind the figure (bench/seat/box). */
  equipment?: Equipment;
  /** Seconds for one A->B sweep. */
  period?: number;
}

// Bone lengths (SVG units). Tuned to sit inside a 110 x 140 viewBox.
export const BONE = {
  torso: 30,
  neck: 5,
  headR: 6,
  upperArm: 14,
  foreArm: 13,
  thigh: 20,
  shin: 20,
  foot: 11,
};

const D = (deg: number) => (deg * Math.PI) / 180;

function step([x, y]: Point, len: number, ang: number): Point {
  return [x + len * Math.cos(D(ang)), y + len * Math.sin(D(ang))];
}

export interface Joints {
  hip: Point;
  shoulder: Point;
  neckBase: Point;
  head: Point;
  elbow: Point;
  hand: Point;
  knee: Point;
  ankle: Point;
  toe: Point;
  kneeB: Point;
  ankleB: Point;
  toeB: Point;
}

export function joints(p: Pose): Joints {
  const hip = p.hip;
  const shoulder = step(hip, BONE.torso, p.torso);
  const neckBase = step(shoulder, BONE.neck, p.torso);
  const head = step(neckBase, BONE.headR, p.torso);
  const elbow = step(shoulder, BONE.upperArm, p.upperArm);
  const hand = step(elbow, BONE.foreArm, p.foreArm);
  const knee = step(hip, BONE.thigh, p.thigh);
  const ankle = step(knee, BONE.shin, p.shin);
  const toe = step(ankle, BONE.foot, p.foot);
  const kneeB = step(hip, BONE.thigh, p.thighB ?? p.thigh);
  const ankleB = step(kneeB, BONE.shin, p.shinB ?? p.shin);
  const toeB = step(ankleB, BONE.foot, p.footB ?? p.foot);
  return { hip, shoulder, neckBase, head, elbow, hand, knee, ankle, toe, kneeB, ankleB, toeB };
}

// The ground/mat line, derived from the figure so a foot never sinks below it
// and a supine back never floats above it. Computed from both keyframes (stable
// within a movement). Stand movements rest on the feet; floor movements on the
// lowest body point.
const FOOT_KEYS: (keyof Joints)[] = ["ankle", "toe", "ankleB", "toeB"];
const BODY_KEYS: (keyof Joints)[] = ["head", "shoulder", "hip", "elbow", "hand", "knee", "ankle", "toe"];
export function groundYFor(mv: Movement): number {
  let maxY = -Infinity;
  const keys = mv.base === "floor" ? BODY_KEYS : FOOT_KEYS;
  for (const p of [mv.a, mv.b]) {
    const j = joints(p);
    for (const k of keys) maxY = Math.max(maxY, j[k][1]);
  }
  return Math.min(137, maxY + 3.2); // sit just under the sole; stay inside the 140 frame
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPt = (a: Point, b: Point, t: number): Point => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    hip: lerpPt(a.hip, b.hip, t),
    torso: lerp(a.torso, b.torso, t),
    upperArm: lerp(a.upperArm, b.upperArm, t),
    foreArm: lerp(a.foreArm, b.foreArm, t),
    thigh: lerp(a.thigh, b.thigh, t),
    shin: lerp(a.shin, b.shin, t),
    foot: lerp(a.foot, b.foot, t),
    thighB: lerp(a.thighB ?? a.thigh, b.thighB ?? b.thigh, t),
    shinB: lerp(a.shinB ?? a.shin, b.shinB ?? b.shin, t),
    footB: lerp(a.footB ?? a.foot, b.footB ?? b.foot, t),
  };
}

// ── Reference standing pose ────────────────────────────────────────────────
// Facing east. Feet flat, arms hanging. hip at (46, 74); ground ~116.
const STAND: Pose = {
  hip: [46, 74],
  torso: -90,
  upperArm: 92,
  foreArm: 90,
  thigh: 90,
  shin: 90,
  foot: 0,
};

const from = (over: Partial<Pose>): Pose => ({ ...STAND, ...over });

// ── The movements ───────────────────────────────────────────────────────────
// Every scheduled exercise gets a visually DISTINCT figure. Where two exercises
// are the same lift (goblet squat + its burnout) they share; otherwise each has
// its own pose, and equipment (bench / seat / box) disambiguates the rest.
export const MOVEMENTS: Record<Archetype, Movement> = {
  // Goblet squat — deep knee-bend, weight held at the chest.
  squat: {
    archetype: "squat", base: "stand", implement: "goblet", period: 2.6,
    a: from({ upperArm: 128, foreArm: -55 }),
    b: { hip: [42, 92], torso: -72, upperArm: 122, foreArm: -48, thigh: 22, shin: 108, foot: 0 },
  },

  // Two-leg hip hinge (RDL) — always bent over, dumbbells tracking the shins.
  hinge: {
    archetype: "hinge", base: "stand", implement: "dumbbell", period: 2.6,
    a: { hip: [49, 73], torso: -46, upperArm: 80, foreArm: 86, thigh: 92, shin: 88, foot: 0 },
    b: { hip: [50, 72], torso: -14, upperArm: 78, foreArm: 86, thigh: 96, shin: 86, foot: 0 },
  },

  // Single-leg RDL — one leg planted, the other reaches straight back (arabesque).
  slRDL: {
    archetype: "slRDL", base: "stand", implement: "dumbbell", period: 2.8,
    a: { hip: [50, 73], torso: -42, upperArm: 82, foreArm: 88, thigh: 90, shin: 90, foot: 0,
         thighB: 150, shinB: 168, footB: 178 },
    b: { hip: [55, 72], torso: -8, upperArm: 84, foreArm: 90, thigh: 90, shin: 90, foot: 0,
         thighB: 190, shinB: 192, footB: 196 },
  },

  // Forward lunge — always a split stance, back knee dropping to the floor.
  lunge: {
    archetype: "lunge", base: "stand", implement: "dumbbell", period: 2.6,
    a: { hip: [45, 84], torso: -88, upperArm: 90, foreArm: 90, thigh: 55, shin: 96, foot: 0,
         thighB: 120, shinB: 72, footB: -18 },
    b: { hip: [44, 90], torso: -88, upperArm: 90, foreArm: 90, thigh: 42, shin: 96, foot: 0,
         thighB: 132, shinB: 58, footB: -18 },
  },

  // Bulgarian split squat — rear foot elevated on a box behind.
  splitSquat: {
    archetype: "splitSquat", base: "stand", implement: "dumbbell", equipment: "rearBox", period: 2.6,
    a: from({ thigh: 74, shin: 96, thighB: 118, shinB: 70, footB: -30 }),
    b: { hip: [46, 92], torso: -84, upperArm: 92, foreArm: 90, thigh: 40, shin: 100, foot: 0,
         thighB: 150, shinB: 40, footB: -50 },
  },

  // Step-up — lead foot planted on the box, drive up to standing on it.
  stepUp: {
    archetype: "stepUp", base: "stand", implement: "dumbbell", equipment: "box", period: 2.8,
    a: { hip: [40, 88], torso: -80, upperArm: 92, foreArm: 90, thigh: -8, shin: 104, foot: 0,
         thighB: 118, shinB: 84, footB: 0 },
    b: { hip: [46, 66], torso: -88, upperArm: 92, foreArm: 90, thigh: 88, shin: 90, foot: 0,
         thighB: 40, shinB: 96, footB: 0 },
  },

  // Standing calf raise — forefoot on a step block, heel drives up.
  calfStand: {
    archetype: "calfStand", base: "stand", implement: "dumbbell", equipment: "stepBlock", period: 2.2,
    a: from({ hip: [46, 74], shin: 90, foot: -8 }),
    b: from({ hip: [46, 67], shin: 82, foot: -42 }),
  },

  // Seated calf raise — seated on a bench, dumbbell on the knee, heel lifts.
  calfSeat: {
    archetype: "calfSeat", base: "stand", implement: "dumbbell", equipment: "seat", period: 2.2,
    a: { hip: [38, 92], torso: -90, upperArm: 116, foreArm: 20, thigh: 2, shin: 92, foot: 2 },
    b: { hip: [38, 92], torso: -90, upperArm: 116, foreArm: 20, thigh: 2, shin: 92, foot: -42 },
  },

  // One-arm DB row — hinged over, one arm drives the elbow up to the ribs.
  rowOneArm: {
    archetype: "rowOneArm", base: "stand", implement: "dumbbell", period: 2.2,
    a: { hip: [50, 74], torso: -20, upperArm: 96, foreArm: 96, thigh: 90, shin: 84, foot: 0 },
    b: { hip: [50, 74], torso: -20, upperArm: 210, foreArm: 120, thigh: 90, shin: 84, foot: 0 },
  },

  // Chest-supported row — chest braced on an incline bench, row the elbow back.
  rowChest: {
    archetype: "rowChest", base: "stand", implement: "dumbbell", equipment: "inclineBench", period: 2.2,
    a: { hip: [44, 78], torso: -46, upperArm: 96, foreArm: 98, thigh: 90, shin: 88, foot: 0 },
    b: { hip: [44, 78], torso: -46, upperArm: 216, foreArm: 122, thigh: 90, shin: 88, foot: 0 },
  },

  // Standing overhead press — press from the shoulders to lockout.
  pressOverhead: {
    archetype: "pressOverhead", base: "stand", implement: "dumbbell", period: 2.2,
    a: from({ upperArm: -40, foreArm: -100 }),
    b: from({ upperArm: -86, foreArm: -90 }),
  },

  // Seated shoulder press — seated on a bench, press overhead.
  pressSeated: {
    archetype: "pressSeated", base: "stand", implement: "dumbbell", equipment: "seat", period: 2.2,
    a: { hip: [38, 92], torso: -90, upperArm: -40, foreArm: -104, thigh: 2, shin: 92, foot: 2 },
    b: { hip: [38, 92], torso: -90, upperArm: -86, foreArm: -90, thigh: 2, shin: 92, foot: 2 },
  },

  // Floor press — on the back, knees bent, press the weights up.
  pressFloor: {
    archetype: "pressFloor", base: "floor", implement: "dumbbell", period: 2.4,
    a: { hip: [66, 110], torso: 180, upperArm: -60, foreArm: -132, thigh: -74, shin: 82, foot: 176 },
    b: { hip: [66, 110], torso: 180, upperArm: -90, foreArm: -90, thigh: -74, shin: 82, foot: 176 },
  },

  // Incline press — reclined on an incline bench, press up and forward.
  pressIncline: {
    archetype: "pressIncline", base: "stand", implement: "dumbbell", equipment: "inclineBench", period: 2.4,
    a: { hip: [40, 98], torso: -40, upperArm: -66, foreArm: -128, thigh: 30, shin: 66, foot: 6 },
    b: { hip: [40, 98], torso: -40, upperArm: -80, foreArm: -88, thigh: 30, shin: 66, foot: 6 },
  },

  // Push-up — a rigid diagonal plank; elbows bend, then extend.
  pushup: {
    archetype: "pushup", base: "floor", implement: "none", period: 2.2,
    a: { hip: [52, 86], torso: 8, upperArm: 64, foreArm: 118, thigh: 152, shin: 152, foot: 150 },
    b: { hip: [52, 80], torso: 6, upperArm: 86, foreArm: 92, thigh: 150, shin: 150, foot: 150 },
  },

  // Lateral raise — arms sweep out to shoulder height (never fully hang).
  lateralRaise: {
    archetype: "lateralRaise", base: "stand", implement: "dumbbell", period: 2.2,
    a: from({ upperArm: 50, foreArm: 48 }),
    b: from({ upperArm: 2, foreArm: 6 }),
  },

  // Rear-delt reverse fly — hinged, arms sweep out and back.
  rearFly: {
    archetype: "rearFly", base: "stand", implement: "dumbbell", period: 2.2,
    a: { hip: [46, 74], torso: -20, upperArm: 100, foreArm: 100, thigh: 90, shin: 84, foot: 0 },
    b: { hip: [46, 74], torso: -20, upperArm: 8, foreArm: 14, thigh: 90, shin: 84, foot: 0 },
  },

  // Curl — upper arm pinned, forearm arcs up (supinated, bar horizontal).
  curl: {
    archetype: "curl", base: "stand", implement: "dumbbell", period: 2.0,
    a: from({ upperArm: 96, foreArm: 40 }),
    b: from({ upperArm: 96, foreArm: -52 }),
  },

  // Hammer curl — same arc, neutral grip (dumbbell held vertical).
  hammerCurl: {
    archetype: "hammerCurl", base: "stand", implement: "dumbbellV", period: 2.0,
    a: from({ upperArm: 96, foreArm: 40 }),
    b: from({ upperArm: 96, foreArm: -52 }),
  },

  // Triceps extension / skull-crusher — upper arm up, forearm extends overhead.
  tricepsExt: {
    archetype: "tricepsExt", base: "stand", implement: "dumbbell", period: 2.0,
    a: from({ upperArm: -84, foreArm: 40 }),
    b: from({ upperArm: -84, foreArm: -88 }),
  },

  // Dead bug — on the back, near arm and knee reach up (tabletop), then extend.
  deadBug: {
    archetype: "deadBug", base: "floor", implement: "none", period: 3.0,
    a: { hip: [58, 108], torso: 180, upperArm: -88, foreArm: -90, thigh: -88, shin: 178, foot: 176 },
    b: { hip: [58, 108], torso: 180, upperArm: -120, foreArm: -118, thigh: -52, shin: -40, foot: -20 },
  },

  // Hollow-body hold — a shallow crescent off the mat, arms past the head.
  hollow: {
    archetype: "hollow", base: "floor", implement: "none", period: 3.4,
    a: { hip: [56, 100], torso: 192, upperArm: 188, foreArm: 190, thigh: -12, shin: -10, foot: -6 },
    b: { hip: [56, 98], torso: 194, upperArm: 190, foreArm: 193, thigh: -18, shin: -16, foot: -12 },
  },

  // Forearm plank — rigid straight body, forearm down on the mat, on the toes.
  plank: {
    archetype: "plank", base: "floor", implement: "none", period: 3.2,
    a: { hip: [54, 92], torso: 6, upperArm: 84, foreArm: 4, thigh: 176, shin: 176, foot: 150 },
    b: { hip: [54, 91], torso: 5, upperArm: 84, foreArm: 4, thigh: 176, shin: 176, foot: 150 },
  },
};

// Map each scheduled exercise name to its movement archetype. Only genuinely
// identical lifts share one (goblet squat + its burnout).
const NAME_TO_ARCHETYPE: Record<string, Archetype> = {
  "Goblet Squat": "squat",
  "Goblet Squat (burnout)": "squat",
  "DB Walking Lunge": "lunge",
  "DB Romanian Deadlift": "hinge",
  "Single-Leg DB RDL": "slRDL",
  "DB Standing Calf Raise": "calfStand",
  "DB Seated Calf Raise": "calfSeat",
  "Dead Bug": "deadBug",
  "Hollow Body Hold": "hollow",
  "Light Core": "plank",
  "One-Arm DB Row": "rowOneArm",
  "Chest-Supported DB Row": "rowChest",
  "DB Overhead Press": "pressOverhead",
  "DB Shoulder Press": "pressSeated",
  "DB Floor Press": "pressFloor",
  "Incline Press / Push-up AMRAP": "pressIncline",
  "Push-up AMRAP": "pushup",
  "DB Reverse Fly": "rearFly",
  "DB Lateral Raise": "lateralRaise",
  "DB Hammer Curl": "hammerCurl",
  "DB Curl": "curl",
  "DB Bulgarian Split Squat": "splitSquat",
  "DB Step-Up": "stepUp",
  "Skull-Crusher / Diamond Push-up": "tricepsExt",
};

export function movementFor(exerciseName: string): Movement | null {
  const a = NAME_TO_ARCHETYPE[exerciseName];
  return a ? MOVEMENTS[a] : null;
}
