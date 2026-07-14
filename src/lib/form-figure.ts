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
  | "lunge"
  | "splitSquat"
  | "stepUp"
  | "calfRaise"
  | "row"
  | "pressV"
  | "pressH"
  | "pushup"
  | "lateralRaise"
  | "rearFly"
  | "curl"
  | "tricepsExt"
  | "coreHold";

/** What the hands hold, draws at the wrist. */
export type Implement = "none" | "dumbbell" | "goblet";

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
export const MOVEMENTS: Record<Archetype, Movement> = {
  // Knee-dominant squat, holding a goblet at the chest.
  squat: {
    archetype: "squat",
    base: "stand",
    implement: "goblet",
    a: from({ upperArm: 128, foreArm: -55 }),
    b: {
      hip: [42, 92],
      torso: -72,
      upperArm: 122,
      foreArm: -48,
      thigh: 22,
      shin: 108,
      foot: 0,
    },
    period: 2.6,
  },

  // Hip hinge (RDL). Back flat, hips travel back, weights track the shins.
  hinge: {
    archetype: "hinge",
    base: "stand",
    implement: "dumbbell",
    a: from({ upperArm: 92, foreArm: 90 }),
    b: {
      hip: [50, 72],
      torso: -18,
      upperArm: 78,
      foreArm: 82,
      thigh: 96,
      shin: 88,
      foot: 0,
    },
    period: 2.8,
  },

  // Forward lunge, front knee bends, back knee drops toward the floor.
  lunge: {
    archetype: "lunge",
    base: "stand",
    implement: "dumbbell",
    a: from({
      upperArm: 90,
      foreArm: 90,
      thighB: 90,
      shinB: 90,
      footB: 0,
    }),
    b: {
      hip: [44, 90],
      torso: -88,
      upperArm: 90,
      foreArm: 90,
      thigh: 42, // front thigh forward-down
      shin: 96, // front shin near vertical, foot planted ahead
      foot: 0,
      thighB: 132, // back thigh sweeps down and behind
      shinB: 58, // back shin drops, knee toward the floor
      footB: -18, // ball of the back foot
    },
    period: 2.8,
  },

  // Bulgarian split squat, rear foot elevated, drop straight down.
  splitSquat: {
    archetype: "splitSquat",
    base: "stand",
    implement: "dumbbell",
    a: from({
      thigh: 74,
      shin: 96,
      thighB: 118,
      shinB: 70,
      footB: -30,
    }),
    b: {
      hip: [46, 92],
      torso: -84,
      upperArm: 92,
      foreArm: 90,
      thigh: 40,
      shin: 100,
      foot: 0,
      thighB: 150,
      shinB: 40,
      footB: -50,
    },
    period: 2.6,
  },

  // Step-up, lead foot planted on the box, drive up to standing on it.
  stepUp: {
    archetype: "stepUp",
    base: "stand",
    implement: "dumbbell",
    // Bottom: hips low, lead foot planted on the box top, trail foot on the floor behind.
    a: {
      hip: [40, 88],
      torso: -80,
      upperArm: 92,
      foreArm: 90,
      thigh: -8, // lead thigh forward, knee high so the foot lands on the box top
      shin: 104, // lead shin drops to the raised foot (~box top)
      foot: 0,
      thighB: 118, // trail leg reaches down and back to the floor
      shinB: 84,
      footB: 0,
    },
    // Top: stood tall on the box, trail knee driven up in front.
    b: {
      hip: [46, 66],
      torso: -88,
      upperArm: 92,
      foreArm: 90,
      thigh: 88, // stance leg straight down onto the box
      shin: 90,
      foot: 0,
      thighB: 40, // trail knee driven up
      shinB: 96,
      footB: 0,
    },
    period: 2.8,
  },

  // Calf raise, rise onto the toes.
  calfRaise: {
    archetype: "calfRaise",
    base: "stand",
    implement: "dumbbell",
    a: from({ hip: [46, 76], shin: 90, foot: 0 }),
    b: from({ hip: [46, 68], shin: 82, foot: -34 }),
    period: 2.2,
  },

  // Bent-over row, hinge held, pull the elbow up to the ribs.
  row: {
    archetype: "row",
    base: "stand",
    implement: "dumbbell",
    a: {
      hip: [50, 74],
      torso: -22,
      upperArm: 96,
      foreArm: 96,
      thigh: 90,
      shin: 84,
      foot: 0,
    },
    b: {
      hip: [50, 74],
      torso: -22,
      upperArm: 210, // elbow drives up and back (short-path equivalent of -150)
      foreArm: 120,
      thigh: 90,
      shin: 84,
      foot: 0,
    },
    period: 2.2,
  },

  // Vertical / overhead press, press from the shoulders to lockout.
  pressV: {
    archetype: "pressV",
    base: "stand",
    implement: "dumbbell",
    a: from({ upperArm: -40, foreArm: -100 }),
    b: from({ upperArm: -86, foreArm: -90 }),
    period: 2.2,
  },

  // Horizontal / floor press, on the back, knees bent, press the weights up.
  pressH: {
    archetype: "pressH",
    base: "floor",
    implement: "dumbbell",
    // Bottom: elbows down near the floor, weights at chest level.
    a: {
      hip: [66, 110],
      torso: 180, // spine flat on the mat, head to the left
      upperArm: -60, // upper arm out toward the floor
      foreArm: -132, // forearm folded, weight low at the chest
      thigh: -74, // knees bent up
      shin: 82, // feet flat on the mat
      foot: 176,
    },
    // Top: arms pressed straight up.
    b: {
      hip: [66, 110],
      torso: 180,
      upperArm: -90, // pressed vertical
      foreArm: -90,
      thigh: -74,
      shin: 82,
      foot: 176,
    },
    period: 2.4,
  },

  // Push-up, a rigid diagonal plank; elbows bend, then extend.
  pushup: {
    archetype: "pushup",
    base: "floor",
    implement: "none",
    // Down: chest low, elbows bent.
    a: {
      hip: [52, 86],
      torso: 8, // plank line, shoulders forward-right toward the head
      upperArm: 64, // upper arm angled toward the floor, elbow flared back
      foreArm: 118,
      thigh: 152, // legs slope back to the toes
      shin: 152,
      foot: 150,
    },
    // Up: arms straight, body pressed up.
    b: {
      hip: [52, 80],
      torso: 6,
      upperArm: 86, // arm straight down to the hand on the floor
      foreArm: 92,
      thigh: 150,
      shin: 150,
      foot: 150,
    },
    period: 2.2,
  },

  // Lateral raise, arms sweep out to shoulder height.
  lateralRaise: {
    archetype: "lateralRaise",
    base: "stand",
    implement: "dumbbell",
    a: from({ upperArm: 88, foreArm: 86 }),
    b: from({ upperArm: 2, foreArm: 6 }),
    period: 2.2,
  },

  // Rear-delt reverse fly, hinged, arms sweep out and back.
  rearFly: {
    archetype: "rearFly",
    base: "stand",
    implement: "dumbbell",
    a: {
      hip: [46, 74], // seated left so the swept-out dumbbell plate stays in-frame
      torso: -20,
      upperArm: 100,
      foreArm: 100,
      thigh: 90,
      shin: 84,
      foot: 0,
    },
    b: {
      hip: [46, 74],
      torso: -20,
      upperArm: 8,
      foreArm: 14,
      thigh: 90,
      shin: 84,
      foot: 0,
    },
    period: 2.2,
  },

  // Curl, upper arm pinned, forearm arcs up.
  curl: {
    archetype: "curl",
    base: "stand",
    implement: "dumbbell",
    a: from({ upperArm: 96, foreArm: 88 }),
    b: from({ upperArm: 96, foreArm: -44 }),
    period: 2.0,
  },

  // Triceps extension / skull-crusher, upper arm up, forearm extends.
  tricepsExt: {
    archetype: "tricepsExt",
    base: "stand",
    implement: "dumbbell",
    a: from({ upperArm: -84, foreArm: 40 }),
    b: from({ upperArm: -84, foreArm: -88 }),
    period: 2.0,
  },

  // Core hold, hollow-body: a shallow crescent floating off the mat, arms
  // reaching past the head, legs long and low. A held brace with a slow pulse.
  coreHold: {
    archetype: "coreHold",
    base: "floor",
    implement: "none",
    a: {
      hip: [61, 100], // seated so the reaching hand stays inside the left edge
      torso: 192, // reclined, head low to the left
      upperArm: 188, // arms reach back past the head
      foreArm: 190,
      thigh: -32, // legs raised and long to the right
      shin: -30,
      foot: -26,
    },
    b: {
      hip: [61, 98], // slight lift, the brace holding
      torso: 194,
      upperArm: 190,
      foreArm: 193,
      thigh: -38,
      shin: -36,
      foot: -32,
    },
    period: 3.4,
  },
};

// Map each scheduled exercise name to its movement archetype.
const NAME_TO_ARCHETYPE: Record<string, Archetype> = {
  "Goblet Squat": "squat",
  "Goblet Squat (burnout)": "squat",
  "DB Walking Lunge": "lunge",
  "DB Romanian Deadlift": "hinge",
  "Single-Leg DB RDL": "hinge",
  "DB Standing Calf Raise": "calfRaise",
  "DB Seated Calf Raise": "calfRaise",
  "Dead Bug": "coreHold",
  "Hollow Body Hold": "coreHold",
  "Light Core": "coreHold",
  "One-Arm DB Row": "row",
  "Chest-Supported DB Row": "row",
  "DB Overhead Press": "pressV",
  "DB Shoulder Press": "pressV",
  "DB Floor Press": "pressH",
  "Incline Press / Push-up AMRAP": "pressH",
  "Push-up AMRAP": "pushup",
  "DB Reverse Fly": "rearFly",
  "DB Lateral Raise": "lateralRaise",
  "DB Hammer Curl": "curl",
  "DB Curl": "curl",
  "DB Bulgarian Split Squat": "splitSquat",
  "DB Step-Up": "stepUp",
  "Skull-Crusher / Diamond Push-up": "tricepsExt",
};

export function movementFor(exerciseName: string): Movement | null {
  const a = NAME_TO_ARCHETYPE[exerciseName];
  return a ? MOVEMENTS[a] : null;
}
