import type {
  DaySchedule,
  MindDayPlan,
  MindBlock,
  MindCategory,
  MindKPIConfig,
  SafeMeal,
  WalkPreset,
} from "@/lib/types";

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

export const MIND_SCHEDULE: MindDayPlan[] = [
  {
    dayOfWeek: "monday",
    blocks: [
      { id: "mon-1", title: "Reading", category: "reading", plannedMinutes: 45 },
      { id: "mon-2", title: "Documentation", category: "documentation", plannedMinutes: 15 },
      { id: "mon-3", title: "Memory Loop", category: "drawing", plannedMinutes: 90, description: "Draw from memory. No reference. Test recall of form, proportion, and structure." },
      { id: "mon-4", title: "Painting Structure", category: "painting", plannedMinutes: 150, description: "Block in painting structure. Values, composition, colour mapping." },
      { id: "mon-5", title: "Style Constitution", category: "writing", plannedMinutes: 30, description: "Write or refine rules that define your visual style." },
    ],
  },
  {
    dayOfWeek: "tuesday",
    blocks: [
      { id: "tue-1", title: "Reading", category: "reading", plannedMinutes: 45 },
      { id: "tue-2", title: "Documentation", category: "documentation", plannedMinutes: 15 },
      { id: "tue-3", title: "Anatomy Simplification", category: "drawing", plannedMinutes: 60, description: "Simplify complex anatomy into geometric forms. Practise construction." },
      { id: "tue-4", title: "Sculpture Session #1", category: "sculpture", plannedMinutes: 90, description: "First sculpture session of the week. Focus on volume and gesture." },
    ],
  },
  {
    dayOfWeek: "wednesday",
    blocks: [
      { id: "wed-1", title: "Reading", category: "reading", plannedMinutes: 45 },
      { id: "wed-2", title: "Documentation", category: "documentation", plannedMinutes: 15 },
      { id: "wed-3", title: "Memory Loop", category: "drawing", plannedMinutes: 90, description: "Draw from memory. No reference. Test recall of form, proportion, and structure." },
      { id: "wed-4", title: "Painting Finish", category: "painting", plannedMinutes: 150, description: "Finish and polish painting. Final details, edges, and colour correction." },
      { id: "wed-5", title: "Self-audit", category: "writing", plannedMinutes: 20, description: "Review the week so far. What worked, what didn't. Honest assessment." },
    ],
  },
  {
    dayOfWeek: "thursday",
    blocks: [
      { id: "thu-1", title: "Reading", category: "reading", plannedMinutes: 45 },
      { id: "thu-2", title: "Documentation", category: "documentation", plannedMinutes: 15 },
      { id: "thu-3", title: "Drapery + Hands", category: "drawing", plannedMinutes: 70, description: "Study drapery folds and hand construction. Focus on rhythm and overlap." },
      { id: "thu-4", title: "Sculpture Session #2", category: "sculpture", plannedMinutes: 90, description: "Second sculpture session. Refine forms and add detail." },
      { id: "thu-5", title: "Collection Bible", category: "writing", plannedMinutes: 45, description: "Write or update the collection bible. Themes, narratives, series structure." },
    ],
  },
  {
    dayOfWeek: "friday",
    blocks: [
      { id: "fri-1", title: "Reading", category: "reading", plannedMinutes: 45 },
      { id: "fri-2", title: "Documentation", category: "documentation", plannedMinutes: 15 },
      { id: "fri-3", title: "Timed Studies", category: "drawing", plannedMinutes: 60, description: "Quick timed gesture and form studies. 2-5 minute poses." },
      { id: "fri-4", title: "Production Painting", category: "painting", plannedMinutes: 150, description: "Full production painting session. Execute at highest level." },
      { id: "fri-5", title: "Admin-lite", category: "admin", plannedMinutes: 30, description: "Light admin tasks. Emails, scheduling, logistics." },
    ],
  },
  {
    dayOfWeek: "saturday",
    blocks: [
      { id: "sat-1", title: "Reading", category: "reading", plannedMinutes: 45 },
      { id: "sat-2", title: "Weekly Review", category: "writing", plannedMinutes: 75, description: "Full weekly review. Assess progress against KPIs. Plan adjustments." },
      { id: "sat-3", title: "Corrections Pass", category: "drawing", plannedMinutes: 120, description: "Revisit week's drawings. Make corrections. Identify recurring weaknesses." },
      { id: "sat-4", title: "Next-week Plan", category: "admin", plannedMinutes: 30, description: "Plan next week's blocks, priorities, and focus areas." },
    ],
  },
  {
    dayOfWeek: "sunday",
    blocks: [
      { id: "sun-1", title: "Reading", category: "reading", plannedMinutes: 45 },
      { id: "sun-2", title: "Memory Sketch", category: "drawing", plannedMinutes: 75, description: "Relaxed memory sketching. No pressure. Explore forms from memory." },
      { id: "sun-3", title: "Reference Library", category: "documentation", plannedMinutes: 50, description: "Organise and curate reference library. Tag, sort, and annotate." },
      { id: "sun-4", title: "Reflection Writing", category: "writing", plannedMinutes: 30, description: "Free-form reflection. Journal about the craft, the journey, the vision." },
    ],
  },
];

// ============ MINIMUM WIN BLOCKS ============

export const MINIMUM_WIN_BLOCKS: MindBlock[] = [
  { id: "min-1", title: "Memory Sketch", category: "drawing", plannedMinutes: 30 },
  { id: "min-2", title: "Paint Session", category: "painting", plannedMinutes: 30 },
  { id: "min-3", title: "Reading", category: "reading", plannedMinutes: 45 },
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
};

// ============ DEEP WORK CATEGORIES ============

export const DEEP_WORK_CATEGORIES: MindCategory[] = [
  "drawing",
  "painting",
  "sculpture",
  "writing",
];

// ============ DEFAULT MIND KPI ============

export const DEFAULT_MIND_KPI: MindKPIConfig = {
  deepWorkTargetHours: 20,
  memoryLoopsTarget: 3,
  sculptureTarget: 2,
  writingPagesTarget: 2,
  documentationTarget: 1,
  readingDailyMinutes: 45,
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
