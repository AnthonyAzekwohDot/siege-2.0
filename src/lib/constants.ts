import { differenceInCalendarDays, parseISO } from "date-fns";
import type {
  DaySchedule,
  Exercise,
  MindDayPlan,
  MindBlock,
  MindCategory,
  MindKPIConfig,
  SafeMeal,
  WalkPreset,
} from "@/lib/types";

// ============ MORNING ROUTINES (A → B → C rotation) ============

export interface MorningRoutine {
  label: string;
  focus: string;
  exercises: Exercise[];
}

/** Epoch for morning routine rotation — Day A starts here */
const MORNING_ROUTINE_EPOCH = "2026-03-12";

export const MORNING_ROUTINES: MorningRoutine[] = [
  {
    label: "Day A",
    focus: "Push & Shoulders",
    exercises: [
      {
        name: "DB Overhead Press",
        sets: 3,
        reps: "10",
        completed: false,
        instructions: "Standing, press dumbbells overhead. Full lockout. Control the descent.",
        muscleGroups: ["shoulders", "triceps"],
        caloriesPerSet: 10,
      },
      {
        name: "Push-ups (slow, 3s lower)",
        sets: 3,
        reps: "12-15",
        completed: false,
        instructions: "Full range push-ups. Lower for a full 3 seconds. Chest to floor. Explode up.",
        muscleGroups: ["chest", "triceps", "shoulders"],
        caloriesPerSet: 12,
      },
      {
        name: "DB Lateral Raises",
        sets: 3,
        reps: "12",
        completed: false,
        instructions: "Raise dumbbells to sides, slight bend in elbows. Lead with elbows. Pause at top.",
        muscleGroups: ["lateral delts"],
        caloriesPerSet: 7,
      },
    ],
  },
  {
    label: "Day B",
    focus: "Arms & Core",
    exercises: [
      {
        name: "DB Curls",
        sets: 3,
        reps: "12",
        completed: false,
        instructions: "Standing, curl dumbbells with control. No swinging. Squeeze at the top.",
        muscleGroups: ["biceps"],
        caloriesPerSet: 8,
      },
      {
        name: "Diamond Push-ups",
        sets: 3,
        reps: "10-12",
        completed: false,
        instructions: "Hands close together in diamond shape. Elbows tight to body. Focus on triceps.",
        muscleGroups: ["triceps", "chest"],
        caloriesPerSet: 12,
      },
      {
        name: "Dead Bugs (slow)",
        sets: 3,
        reps: "10/side",
        completed: false,
        instructions: "Lie on back, extend opposite arm and leg. Keep lower back pressed to floor. Slow and controlled.",
        muscleGroups: ["core", "deep abs"],
        caloriesPerSet: 6,
      },
      {
        name: "Plank (max hold)",
        sets: 1,
        reps: "max",
        completed: false,
        instructions: "Forearms on floor, body straight. Squeeze glutes and abs. No sagging hips. Hold as long as possible.",
        muscleGroups: ["core", "shoulders"],
        caloriesPerSet: 8,
      },
    ],
  },
  {
    label: "Day C",
    focus: "Posture & Pull",
    exercises: [
      {
        name: "DB Bent-over Rows",
        sets: 3,
        reps: "10",
        completed: false,
        instructions: "Bent at hips, pull dumbbells to hip. Squeeze shoulder blades together. Control down.",
        muscleGroups: ["lats", "rhomboids", "biceps"],
        caloriesPerSet: 10,
      },
      {
        name: "DB Romanian Deadlifts",
        sets: 3,
        reps: "10",
        completed: false,
        instructions: "Hinge at hips, dumbbells slide down legs. Feel the hamstring stretch. Squeeze glutes to stand.",
        muscleGroups: ["hamstrings", "glutes", "lower back"],
        caloriesPerSet: 12,
      },
      {
        name: "Reverse Snow Angels",
        sets: 3,
        reps: "12",
        completed: false,
        instructions: "Lying face down, arms sweep from sides to overhead and back. Squeeze upper back throughout.",
        muscleGroups: ["upper back", "rear delts", "traps"],
        caloriesPerSet: 6,
      },
      {
        name: "Hollow Body Hold",
        sets: 3,
        reps: "20sec",
        completed: false,
        instructions: "Lie on back, arms overhead, legs straight and off the floor. Press lower back into floor. Hold.",
        muscleGroups: ["core", "deep abs"],
        caloriesPerSet: 7,
      },
    ],
  },
];

/** Get the morning routine (A/B/C) for a given date string (yyyy-MM-dd) */
export function getMorningRoutineForDate(dateStr: string): MorningRoutine {
  const days = differenceInCalendarDays(parseISO(dateStr), parseISO(MORNING_ROUTINE_EPOCH));
  // Ensure positive modulo
  const index = ((days % 3) + 3) % 3;
  return MORNING_ROUTINES[index];
}

// ============ WORKOUT SCHEDULE ============

export const WORKOUT_SCHEDULE: DaySchedule[] = [
  {
    day: "monday",
    focus: "Chest + Front Delts + Core",
    purpose: "Build pressing strength and anterior chain density",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: false,
    isOptional: false,
    exercises: [
      {
        name: "DB Floor Press",
        sets: 4,
        reps: "10",
        completed: false,
        instructions: "Lie on floor, press dumbbells up. Elbows touch floor each rep. Squeeze chest at top.",
        muscleGroups: ["chest", "triceps"],
        diagram: `
    O
   /|\\
  / | \\
 [DB] [DB]
    |
   / \\
  /   \\
(flat on floor)`,
        caloriesPerSet: 12,
      },
      {
        name: "Incline Push-Up",
        sets: 3,
        reps: "max",
        completed: false,
        instructions: "Hands on elevated surface (bed/chair). Full range of motion. Chest to surface each rep.",
        muscleGroups: ["upper chest", "shoulders", "triceps"],
        diagram: `
     O
    /|
   / |\\
  /  | \\
 /   |  \\
/    |   \\
--------[surface]`,
        caloriesPerSet: 15,
      },
      {
        name: "DB Squeeze Press",
        sets: 3,
        reps: "12",
        completed: false,
        instructions: "Press dumbbells together throughout the movement. Squeeze hard. Slow on the way down.",
        muscleGroups: ["inner chest", "triceps"],
        diagram: `
    O
   /|\\
  [DB|DB]
    |
   / \\
  /   \\
(flat on floor)`,
        caloriesPerSet: 10,
      },
      {
        name: "DB Front Raises",
        sets: 3,
        reps: "15",
        completed: false,
        instructions: "Standing, raise dumbbells in front to shoulder height. Control the negative. No swinging.",
        muscleGroups: ["front delts"],
        diagram: `
    O
   /|\\
  / | \\
[DB]|[DB]
    |    --> raise to shoulder height
   / \\
  /   \\`,
        caloriesPerSet: 8,
      },
      {
        name: "Dead Bug",
        sets: 3,
        reps: "12",
        completed: false,
        instructions: "Lie on back, extend opposite arm and leg. Keep lower back pressed to floor. Alternate sides.",
        muscleGroups: ["core", "deep abs"],
        diagram: `
  \\O/
   |
  /|\\
 / | \\
(arms + legs extend opposite)`,
        caloriesPerSet: 6,
      },
    ],
  },
  {
    day: "tuesday",
    focus: "Walk Only (Active Recovery)",
    purpose: "Let muscles recover while keeping metabolism active",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: true,
    isOptional: false,
    exercises: [],
  },
  {
    day: "wednesday",
    focus: "Shoulders + Upper Chest + Obliques",
    purpose: "Build shoulder width and upper chest shelf",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: false,
    isOptional: false,
    exercises: [
      {
        name: "DB Shoulder Press",
        sets: 4,
        reps: "10",
        completed: false,
        instructions: "Seated or standing, press dumbbells overhead. Full lockout at top. Control the descent.",
        muscleGroups: ["shoulders", "triceps"],
        diagram: `
  [DB] [DB]
    \\O/
     |
    / \\
   /   \\
(press overhead)`,
        caloriesPerSet: 12,
      },
      {
        name: "Lateral Raises",
        sets: 5,
        reps: "12-20",
        completed: false,
        instructions: "Raise dumbbells to sides, slight bend in elbows. Lead with elbows. Pause at top.",
        muscleGroups: ["lateral delts"],
        diagram: `
[DB]--O--[DB]
      |
     / \\
    /   \\
(arms out to sides)`,
        caloriesPerSet: 7,
      },
      {
        name: "Incline Fly (floor with pillow)",
        sets: 3,
        reps: "12",
        completed: false,
        instructions: "Lie on floor with pillow under upper back. Open arms wide, squeeze chest to close. Slow negatives.",
        muscleGroups: ["upper chest", "front delts"],
        diagram: `
    O
   /|\\
  / | \\
[DB] [DB]  <-- open wide
    |
   / \\
[pillow under back]`,
        caloriesPerSet: 8,
      },
      {
        name: "Shrugs",
        sets: 3,
        reps: "12",
        completed: false,
        instructions: "Hold heavy dumbbells at sides. Shrug shoulders to ears. Hold at top for 1 second.",
        muscleGroups: ["traps"],
        diagram: `
    O
  --|--
  | | |
[DB]|[DB]
   / \\
  /   \\
(shrug up to ears)`,
        caloriesPerSet: 6,
      },
      {
        name: "Russian Twists",
        sets: 3,
        reps: "20",
        completed: false,
        instructions: "Seated, lean back 45 degrees. Rotate torso side to side. Hold weight or bodyweight. Feet off floor.",
        muscleGroups: ["obliques", "core"],
        diagram: `
    O
   /|\\  <-- rotate
    |
   / \\
  (feet off floor)`,
        caloriesPerSet: 8,
      },
    ],
  },
  {
    day: "thursday",
    focus: "Walk Only (Metabolic Day)",
    purpose: "Active recovery to boost metabolism and fat burning",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: true,
    isOptional: false,
    exercises: [],
  },
  {
    day: "friday",
    focus: "Back + Chest Density + Core",
    purpose: "Build back thickness and chest endurance",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: false,
    isOptional: false,
    exercises: [
      {
        name: "DB Rows",
        sets: 4,
        reps: "12/side",
        completed: false,
        instructions: "One arm at a time, support on bench/bed. Pull to hip. Squeeze shoulder blade. Control down.",
        muscleGroups: ["lats", "rhomboids", "biceps"],
        diagram: `
    O
   /|
  / |\\
 /  | [DB]
/   |
----|----[bench]
   / \\`,
        caloriesPerSet: 12,
      },
      {
        name: "Reverse Fly",
        sets: 3,
        reps: "15",
        completed: false,
        instructions: "Bent over, raise dumbbells out to sides. Squeeze shoulder blades together. Light weight, high control.",
        muscleGroups: ["rear delts", "rhomboids"],
        diagram: `
      O
     /|\\
    / | \\
[DB]  |  [DB]
      |
     / \\
(bent over at hips)`,
        caloriesPerSet: 7,
      },
      {
        name: "DB Pullover",
        sets: 3,
        reps: "12",
        completed: false,
        instructions: "Lie on floor, hold one DB overhead. Lower behind head with straight arms. Pull back over chest.",
        muscleGroups: ["lats", "chest", "serratus"],
        diagram: `
[DB] <-- lower behind head
  \\
   O
   |
  / \\
 /   \\
(flat on floor)`,
        caloriesPerSet: 10,
      },
      {
        name: "Narrow Floor Press",
        sets: 3,
        reps: "10",
        completed: false,
        instructions: "Floor press with hands closer together. Elbows tucked. Emphasise triceps and inner chest.",
        muscleGroups: ["inner chest", "triceps"],
        diagram: `
    O
   /|\\
  [DB|DB]  <-- narrow grip
    |
   / \\
  /   \\
(flat on floor)`,
        caloriesPerSet: 10,
      },
      {
        name: "Plank",
        sets: 3,
        reps: "45sec",
        completed: false,
        instructions: "Forearms on floor, body straight. Squeeze glutes and abs. No sagging hips. Breathe steady.",
        muscleGroups: ["core", "shoulders"],
        diagram: `
    O-----
   /|     \\
  / |------\\
 /  |       \\
(forearms)  (toes)`,
        caloriesPerSet: 8,
      },
    ],
  },
  {
    day: "saturday",
    focus: "Optional Light Sculpting or Walk Only",
    purpose: "Light pump work if feeling good, otherwise just walk",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: false,
    isOptional: true,
    exercises: [
      {
        name: "Lateral Raises",
        sets: 3,
        reps: "20",
        completed: false,
        instructions: "Light weight, high reps. Focus on the burn. Slow and controlled.",
        muscleGroups: ["lateral delts"],
        diagram: `
[DB]--O--[DB]
      |
     / \\
    /   \\
(arms out to sides)`,
        caloriesPerSet: 7,
      },
      {
        name: "Pushups",
        sets: 2,
        reps: "max",
        completed: false,
        instructions: "Full range pushups. Chest to floor. Lock out at top. Go to failure.",
        muscleGroups: ["chest", "triceps", "shoulders"],
        diagram: `
     O
    /|\\
   / | \\
  /  |  \\
 /   |   \\
/----|----\\
(hands shoulder width)`,
        caloriesPerSet: 15,
      },
      {
        name: "Light Core",
        sets: 1,
        reps: "5min",
        completed: false,
        instructions: "Mix of dead bugs, crunches, and leg raises. Keep it light. 5 minutes continuous.",
        muscleGroups: ["core", "abs"],
        diagram: `
  \\O/
   |
  /|\\
 / | \\
(various core moves)`,
        caloriesPerSet: 25,
      },
    ],
  },
  {
    day: "sunday",
    focus: "Rest Walk",
    purpose: "Full rest day. Walk only for mental clarity.",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: true,
    isOptional: true,
    exercises: [],
  },
];

// ============ MIND SCHEDULE ============
// Rebuilt for 0.1% mastery. Every block targets specific fundamentals.
// Fundamentals: hands, head, muscle-groups, gesture, shape, form, colour, composition, values, narrative

export const MIND_SCHEDULE: MindDayPlan[] = [
  {
    dayOfWeek: "monday",
    blocks: [
      { id: "mon-1", title: "Daily Planning", category: "documentation", plannedMinutes: 15, description: "Plan the day. What fundamentals are you targeting? What does a win look like today?" },
      { id: "mon-1b", title: "Reading", category: "reading", plannedMinutes: 60 },
      { id: "mon-2", title: "Master Study", category: "master-study", plannedMinutes: 60, description: "Pick one master. Copy a section. Understand WHY it works, not just WHAT it looks like.", focusOptions: ["composition", "values", "colour-theory", "proportion-placement", "form-construction"] },
      { id: "mon-3", title: "Memory Loop", category: "drawing", plannedMinutes: 60, description: "Draw from memory. No reference. If you can't draw it from memory, you don't know it yet.", focusOptions: ["proportion-placement", "form-construction", "anatomy", "gesture", "perspective"] },
      { id: "mon-4", title: "Painting Structure", category: "painting", plannedMinutes: 150, description: "Block in painting. Values first, then colour. Composition locked before any detail.", focusOptions: ["composition", "values", "colour-theory"] },
      { id: "mon-5", title: "Style Constitution", category: "writing", plannedMinutes: 45, description: "Write or refine rules that define your visual style. What you do. What you refuse to do." },
    ],
  },
  {
    dayOfWeek: "tuesday",
    blocks: [
      { id: "tue-1", title: "Daily Planning", category: "documentation", plannedMinutes: 15, description: "Plan the day. What fundamentals are you targeting? What does a win look like today?" },
      { id: "tue-1b", title: "Reading", category: "reading", plannedMinutes: 60 },
      { id: "tue-2", title: "Anatomy Drill", category: "drawing", plannedMinutes: 60, description: "Pure anatomy construction. Simplify into geometric forms. Practise until the pen knows the path.", focusOptions: ["anatomy", "form-construction", "proportion-placement", "gesture"] },
      { id: "tue-3", title: "Sculpture Session", category: "sculpture", plannedMinutes: 120, description: "3D fundamentals. Volume, gesture, planes. Same fundamentals as 2D but in space.", focusOptions: ["form-construction", "anatomy", "gesture", "proportion-placement"] },
      { id: "tue-4", title: "Colour Study", category: "painting", plannedMinutes: 60, description: "Isolated colour work. Mixing, palette studies, colour from memory. Colour is its own beast.", focusOptions: ["colour-theory", "values"] },
      { id: "tue-5", title: "Experimentation", category: "experimentation", plannedMinutes: 45, description: "Try something you've never tried. New medium, technique, or approach. Failure is the point.", focusOptions: ["colour-theory", "composition", "values", "form-construction", "perspective"] },
    ],
  },
  {
    dayOfWeek: "wednesday",
    blocks: [
      { id: "wed-1", title: "Daily Planning", category: "documentation", plannedMinutes: 15, description: "Plan the day. What fundamentals are you targeting? What does a win look like today?" },
      { id: "wed-1b", title: "Reading", category: "reading", plannedMinutes: 60 },
      { id: "wed-2", title: "Master Study", category: "master-study", plannedMinutes: 60, description: "Different master from Monday. Study their strengths where you are weakest.", focusOptions: ["composition", "values", "colour-theory", "proportion-placement", "form-construction"] },
      { id: "wed-3", title: "Memory Loop", category: "drawing", plannedMinutes: 60, description: "Draw from memory. Compare to reference AFTER. Identify the gaps.", focusOptions: ["proportion-placement", "form-construction", "anatomy", "gesture", "perspective"] },
      { id: "wed-4", title: "Painting Finish", category: "painting", plannedMinutes: 150, description: "Finish and polish. Edges, colour correction, final details. Execute at your highest standard.", focusOptions: ["composition", "values", "colour-theory"] },
      { id: "wed-5", title: "Self-audit", category: "writing", plannedMinutes: 30, description: "What improved this week? What's still weak? Be honest. Write it down." },
    ],
  },
  {
    dayOfWeek: "thursday",
    blocks: [
      { id: "thu-1", title: "Daily Planning", category: "documentation", plannedMinutes: 15, description: "Plan the day. What fundamentals are you targeting? What does a win look like today?" },
      { id: "thu-1b", title: "Reading", category: "reading", plannedMinutes: 60 },
      { id: "thu-2", title: "Construction Drill", category: "drawing", plannedMinutes: 60, description: "Heads, hands, and full figures from construction. Mannequinise then detail.", focusOptions: ["form-construction", "anatomy", "proportion-placement", "gesture", "perspective"] },
      { id: "thu-3", title: "Sculpture Session", category: "sculpture", plannedMinutes: 120, description: "Push detail and surface quality. Refine what Tuesday started.", focusOptions: ["form-construction", "anatomy", "gesture", "proportion-placement"] },
      { id: "thu-4", title: "Colour Study", category: "painting", plannedMinutes: 60, description: "Colour relationships, temperature shifts, limited palette exercises. Train the eye.", focusOptions: ["colour-theory", "values"] },
      { id: "thu-5", title: "Collection Bible", category: "writing", plannedMinutes: 45, description: "Write or update the collection bible. Themes, narratives, series structure." },
    ],
  },
  {
    dayOfWeek: "friday",
    blocks: [
      { id: "fri-1", title: "Daily Planning", category: "documentation", plannedMinutes: 15, description: "Plan the day. What fundamentals are you targeting? What does a win look like today?" },
      { id: "fri-1b", title: "Reading", category: "reading", plannedMinutes: 60 },
      { id: "fri-2", title: "Timed Studies", category: "drawing", plannedMinutes: 45, description: "Quick timed gesture and form studies. 2-5 minute poses. Speed builds instinct.", focusOptions: ["gesture", "form-construction", "proportion-placement", "anatomy"] },
      { id: "fri-3", title: "Production Painting", category: "painting", plannedMinutes: 180, description: "Full production painting. This is game day. Execute at the highest level you can reach.", focusOptions: ["composition", "values", "colour-theory"] },
      { id: "fri-4", title: "Experimentation", category: "experimentation", plannedMinutes: 45, description: "Try something uncomfortable. New colour palette, unfamiliar subject, different tool.", focusOptions: ["colour-theory", "composition", "values", "form-construction", "perspective"] },
    ],
  },
  {
    dayOfWeek: "saturday",
    blocks: [
      { id: "sat-1", title: "Daily Planning", category: "documentation", plannedMinutes: 15, description: "Plan the day. What fundamentals are you targeting? What does a win look like today?" },
      { id: "sat-1b", title: "Reading", category: "reading", plannedMinutes: 60 },
      { id: "sat-2", title: "Sculpture Session", category: "sculpture", plannedMinutes: 120, description: "Third session of the week. Long-form sculpting. Push ambition.", focusOptions: ["form-construction", "anatomy", "gesture", "proportion-placement"] },
      { id: "sat-3", title: "Life Drawing", category: "drawing", plannedMinutes: 120, description: "Draw from life. Physical objects, self-portrait, anything real in front of you. Train the eye, not the memory.", focusOptions: ["gesture", "form-construction", "proportion-placement", "values", "anatomy", "perspective"], monthlyOnly: true },
      { id: "sat-4", title: "Corrections Pass", category: "drawing", plannedMinutes: 75, description: "Revisit the week's drawings. Overlay corrections. What errors keep recurring?", focusOptions: ["proportion-placement", "form-construction", "anatomy", "gesture", "perspective", "values"] },
      { id: "sat-5", title: "Weekly Review", category: "writing", plannedMinutes: 75, description: "Full weekly review. Which fundamentals got attention? Which were neglected? Rate your growth honestly." },
      { id: "sat-6", title: "Next-week Plan", category: "admin", plannedMinutes: 30, description: "Plan next week. Target your weakest fundamental hardest." },
    ],
  },
  {
    dayOfWeek: "sunday",
    blocks: [
      { id: "sun-1", title: "Daily Planning", category: "documentation", plannedMinutes: 15, description: "Plan the day. What fundamentals are you targeting? What does a win look like today?" },
      { id: "sun-1b", title: "Reading", category: "reading", plannedMinutes: 60 },
      { id: "sun-2", title: "Memory Sketch", category: "drawing", plannedMinutes: 60, description: "Relaxed memory sketching. Draw what you love. Let instinct lead.", focusOptions: ["gesture", "form-construction", "composition", "proportion-placement"] },
      { id: "sun-3", title: "Reference Library", category: "documentation", plannedMinutes: 50, description: "Organise and curate reference library. Tag by fundamental." },
      { id: "sun-4", title: "Reflection Writing", category: "writing", plannedMinutes: 45, description: "Where are you on the path? What does the 0.1% version of you do differently?" },
    ],
  },
];

// ============ MINIMUM WIN BLOCKS ============

export const MINIMUM_WIN_BLOCKS: MindBlock[] = [
  { id: "min-1", title: "Memory Sketch", category: "drawing", plannedMinutes: 30, focusOptions: ["gesture", "form-construction", "proportion-placement", "anatomy"] },
  { id: "min-2", title: "Paint Session", category: "painting", plannedMinutes: 30, focusOptions: ["values", "colour-theory", "composition"] },
  { id: "min-3", title: "Reading", category: "reading", plannedMinutes: 60 },
];

// ============ MIND CATEGORY INFO ============

export const MIND_CATEGORY_INFO: Record<MindCategory, string> = {
  drawing: "chart-1",
  painting: "chart-2",
  sculpture: "chart-3",
  writing: "chart-4",
  reading: "chart-5",
  admin: "muted-foreground",
  documentation: "primary",
  "master-study": "chart-4",
  experimentation: "chart-2",
};

// ============ DEEP WORK CATEGORIES ============

export const DEEP_WORK_CATEGORIES: MindCategory[] = [
  "drawing",
  "painting",
  "sculpture",
  "writing",
  "master-study",
  "experimentation",
];

// ============ DEFAULT MIND KPI ============

export const DEFAULT_MIND_KPI: MindKPIConfig = {
  deepWorkTargetHours: 25,
  memoryLoopsTarget: 3,
  sculptureTarget: 2,
  writingPagesTarget: 2,
  documentationTarget: 1,
  readingDailyMinutes: 60,
};

// ============ DEFAULT SAFE MEALS ============

export const DEFAULT_SAFE_MEALS: SafeMeal[] = [
  { id: "sm-1", name: "Greek Yogurt + Berries", calories: 200 },
  { id: "sm-2", name: "Protein Shake", calories: 250 },
  { id: "sm-3", name: "Egg White Omelette", calories: 300 },
  { id: "sm-4", name: "Grilled Chicken Salad", calories: 400 },
  { id: "sm-5", name: "Cottage Cheese Bowl", calories: 350 },
];

// ============ DEFAULT WALK PRESETS ============

export const DEFAULT_WALK_PRESETS: WalkPreset[] = [
  { id: "wp-1", name: "Quick 10-min Walk", calories: 50 },
  { id: "wp-2", name: "15-min Brisk Walk", calories: 100 },
  { id: "wp-3", name: "20-min Evening Stroll", calories: 150 },
  { id: "wp-4", name: "30-min Power Walk", calories: 200 },
];
