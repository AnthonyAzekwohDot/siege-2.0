import { differenceInCalendarDays, parseISO } from "date-fns";
import type {
  DaySchedule,
  MindDayPlan,
  MindBlock,
  MindCategory,
  MindKPIConfig,
  PhaseInfo,
  TrainingPhase,
  SafeMeal,
  WalkPreset,
} from "@/lib/types";

// ============ WORKOUT SCHEDULE (4-day Upper/Lower, home 15kg + gym) ============
// Legs are a named half of the week, push/pull is balanced posterior-favoured,
// and hard pressing is one quality day. Daily movement is the WALK, not push-ups.
// Each loaded lift carries a repRange for double progression; homeAlt explains
// how to keep it hard with fixed 15kg dumbbells once load tops out.

export const WORKOUT_SCHEDULE: DaySchedule[] = [
  {
    day: "monday",
    focus: "Lower A · Quads + Hams",
    purpose: "The leg day that was missing. Knee-dominant lead.",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: false,
    isOptional: false,
    exercises: [
      { name: "Goblet Squat", sets: 4, reps: "8-12", repRange: [8, 12], completed: false,
        instructions: "Hold one dumbbell at your chest. Sit down between your hips, knees track over toes, chest tall. Drive through mid-foot.",
        muscleGroups: ["quads", "glutes"],
        homeAlt: "15kg goblet. When 4x12 is easy, elevate your heels or add a 3s descent and a 2s pause at the bottom before buying load.",
        caloriesPerSet: 12 },
      { name: "DB Walking Lunge", sets: 3, reps: "10/leg", repRange: [10, 12], completed: false,
        instructions: "Long step, drop the back knee toward the floor, push through the front heel to stand. Stay tall.",
        muscleGroups: ["quads", "glutes"],
        homeAlt: "A 15kg in each hand, or one 15kg held at the chest. Slow the descent to add difficulty.",
        caloriesPerSet: 12 },
      { name: "DB Romanian Deadlift", sets: 4, reps: "10-12", repRange: [10, 12], completed: false,
        instructions: "Soft knees, push the hips back, dumbbells slide down the thighs. Feel the hamstring stretch, squeeze glutes to stand. Flat back throughout.",
        muscleGroups: ["hamstrings", "glutes"],
        homeAlt: "Both 15kg with a 3s eccentric. When easy, switch to single-leg RDL to double the load per leg.",
        caloriesPerSet: 12 },
      { name: "DB Standing Calf Raise", sets: 4, reps: "12-20", repRange: [12, 20], completed: false,
        instructions: "Up onto the toes, full stretch at the bottom, pause and squeeze at the top. Control, no bouncing.",
        muscleGroups: ["calves"],
        homeAlt: "One 15kg, one leg at a time, off a step for full range.",
        caloriesPerSet: 6 },
      { name: "Dead Bug", sets: 3, reps: "10/side", completed: false, isBodyweight: true,
        instructions: "On your back, lower back pressed flat. Extend the opposite arm and leg slowly, return, alternate. No arching.",
        muscleGroups: ["core", "deep abs"],
        caloriesPerSet: 6 },
    ],
  },
  {
    day: "tuesday",
    focus: "Upper A · Pull Lead",
    purpose: "Pull-led to undo the front-dominant posture.",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: false,
    isOptional: false,
    exercises: [
      { name: "One-Arm DB Row", sets: 4, reps: "10-12/side", repRange: [10, 12], completed: false,
        instructions: "Hand and knee on a bench/bed, flat back. Pull the dumbbell to your hip, squeeze the shoulder blade, control it down. No twisting.",
        muscleGroups: ["lats", "rhomboids", "biceps"],
        homeAlt: "15kg, add a 1s pause at the top. When easy, slow the eccentric to 3s.",
        caloriesPerSet: 12 },
      { name: "Chest-Supported DB Row", sets: 3, reps: "10-15", repRange: [10, 15], completed: false,
        instructions: "Chest on an incline (bench/sofa arm). Row both dumbbells to the ribs, elbows about 45 degrees, squeeze the mid-back.",
        muscleGroups: ["mid-back", "rear delts"],
        homeAlt: "Both 15kg. Pause at the top each rep to make it bite.",
        caloriesPerSet: 10 },
      { name: "DB Overhead Press", sets: 3, reps: "8-12", repRange: [8, 12], completed: false,
        instructions: "Press from the shoulder to full lockout, ribs down (do not arch the back), control the descent.",
        muscleGroups: ["shoulders", "triceps"],
        homeAlt: "Both 15kg. Seated with a tall back and slow tempo, or single-arm for more load.",
        caloriesPerSet: 10 },
      { name: "DB Reverse Fly", sets: 3, reps: "12-20", repRange: [12, 20], completed: false,
        instructions: "Hinge over, soft elbows, raise the dumbbells out to the sides leading with the elbows. Squeeze the rear delts. Light and strict.",
        muscleGroups: ["rear delts", "rhomboids"],
        homeAlt: "Lighter than 15kg if needed; this is a quality move, not a load move.",
        caloriesPerSet: 6 },
      { name: "DB Lateral Raise", sets: 3, reps: "12-20", repRange: [12, 20], completed: false,
        instructions: "Slight bend in the elbows, raise to shoulder height leading with the elbows, pause, lower slowly.",
        muscleGroups: ["lateral delts"],
        homeAlt: "15kg or lighter. Add lengthened partials at the bottom when you hit the top of the range.",
        caloriesPerSet: 6 },
      { name: "DB Hammer Curl", sets: 3, reps: "8-12", repRange: [8, 12], completed: false,
        instructions: "Neutral grip (thumbs up), curl without swinging, squeeze, lower under control.",
        muscleGroups: ["biceps", "forearms"],
        homeAlt: "Both 15kg. Slow eccentric or a pause at the top when easy.",
        caloriesPerSet: 7 },
    ],
  },
  {
    day: "wednesday",
    focus: "Walk Only · Recovery",
    purpose: "True rest. Steady-state walk, inhaler nearby.",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: true,
    isOptional: false,
    exercises: [],
  },
  {
    day: "thursday",
    focus: "Lower B · Hips + Unilateral",
    purpose: "Single-leg strength and posterior chain.",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: false,
    isOptional: false,
    exercises: [
      { name: "DB Bulgarian Split Squat", sets: 4, reps: "8-10/leg", repRange: [8, 10], completed: false,
        instructions: "Rear foot on a chair/bed. Drop straight down over the front leg, knee tracks the toes, push through the front heel. Stay upright.",
        muscleGroups: ["quads", "glutes"],
        homeAlt: "15kg in each hand. Brutal at bodyweight first; add load only when 4x10/leg is clean.",
        caloriesPerSet: 12 },
      { name: "Single-Leg DB RDL", sets: 3, reps: "10-12/leg", repRange: [10, 12], completed: false,
        instructions: "Hinge on one leg, the free leg extends behind, dumbbell(s) lower toward the floor with a flat back. The standing hamstring does the work.",
        muscleGroups: ["hamstrings", "glutes"],
        homeAlt: "One or two 15kg. Fingertip on a wall for balance; B-stance RDL is an easier regression.",
        caloriesPerSet: 12 },
      { name: "DB Step-Up", sets: 3, reps: "10/leg", repRange: [8, 12], completed: false,
        instructions: "Onto a bench/sturdy chair. Drive through the top leg's heel, stand tall, lower under control. Minimal push-off from the bottom foot.",
        muscleGroups: ["quads", "glutes"],
        homeAlt: "15kg per hand. Raise the step height to progress before adding load.",
        caloriesPerSet: 10 },
      { name: "Goblet Squat (burnout)", sets: 3, reps: "12-20", repRange: [12, 20], completed: false,
        instructions: "Lighter, higher reps, continuous tension. Chase the burn, full depth each rep.",
        muscleGroups: ["quads", "glutes"],
        homeAlt: "15kg goblet. Slow tempo to make 20 reps count.",
        caloriesPerSet: 10 },
      { name: "DB Seated Calf Raise", sets: 4, reps: "15-25", repRange: [15, 25], completed: false,
        instructions: "Dumbbell on the knee, raise the heel, full stretch and squeeze. Slow.",
        muscleGroups: ["calves", "soleus"],
        homeAlt: "One 15kg on each knee, or one leg at a time.",
        caloriesPerSet: 5 },
      { name: "Hollow Body Hold", sets: 3, reps: "20-30s", completed: false, isBodyweight: true,
        instructions: "On your back, lower back pressed into the floor, arms and legs extended and lifted. Hold. Lower the limbs to make it easier.",
        muscleGroups: ["core", "deep abs"],
        caloriesPerSet: 6 },
    ],
  },
  {
    day: "friday",
    focus: "Upper B · Press Day",
    purpose: "The one hard pressing day. Pull stays in to hold the ratio.",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: false,
    isOptional: false,
    exercises: [
      { name: "DB Floor Press", sets: 4, reps: "8-12", repRange: [8, 12], completed: false,
        instructions: "On the floor, press the dumbbells up and together at the top. Elbows touch the floor each rep (built-in depth control). Squeeze the chest.",
        muscleGroups: ["chest", "triceps"],
        homeAlt: "Both 15kg. Add a 2s pause on the floor, or a 3s eccentric, when 4x12 is easy.",
        caloriesPerSet: 12 },
      { name: "One-Arm DB Row", sets: 4, reps: "10-12/side", repRange: [10, 12], completed: false,
        instructions: "Pull to the hip, squeeze the shoulder blade, control down. Keeps total pulling ahead of pressing across the week.",
        muscleGroups: ["lats", "rhomboids", "biceps"],
        homeAlt: "15kg with a pause at the top.",
        caloriesPerSet: 12 },
      { name: "DB Shoulder Press", sets: 3, reps: "8-12", repRange: [8, 12], completed: false,
        instructions: "Seated or standing, press to lockout, ribs down, control the descent.",
        muscleGroups: ["shoulders", "triceps"],
        homeAlt: "Both 15kg, slow tempo, or single-arm for more load.",
        caloriesPerSet: 10 },
      { name: "Incline Press / Push-up AMRAP", sets: 2, reps: "max", completed: false, isBodyweight: true,
        instructions: "Feet-elevated push-ups (or incline DB press), last 2 sets to near failure. LOG THE REP COUNT each set. This is a rep PR you chase.",
        muscleGroups: ["upper chest", "shoulders", "triceps"],
        caloriesPerSet: 14 },
      { name: "DB Lateral Raise", sets: 3, reps: "12-20", repRange: [12, 20], completed: false,
        instructions: "Strict, lead with the elbows, pause at shoulder height, lower slowly.",
        muscleGroups: ["lateral delts"],
        homeAlt: "15kg or lighter, lengthened partials at the bottom when you top the range.",
        caloriesPerSet: 6 },
      { name: "DB Curl", sets: 3, reps: "8-12", repRange: [8, 12], completed: false,
        instructions: "No swing, full range, squeeze at the top, slow on the way down.",
        muscleGroups: ["biceps"],
        homeAlt: "Both 15kg, slow eccentric when easy.",
        caloriesPerSet: 7 },
      { name: "Skull-Crusher / Diamond Push-up", sets: 3, reps: "10-15", repRange: [10, 15], completed: false,
        instructions: "Triceps finisher. Skull-crushers lying down (elbows in), or diamond push-ups to failure.",
        muscleGroups: ["triceps"],
        homeAlt: "15kg, controlled. Diamond push-ups if there is no room to lie out.",
        caloriesPerSet: 8 },
    ],
  },
  {
    day: "saturday",
    focus: "Optional · Pump / Rep-PR",
    purpose: "Skip freely if recovery is poor. Zero penalty.",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: false,
    isOptional: true,
    exercises: [
      { name: "Push-up AMRAP", sets: 2, reps: "max", completed: false, isBodyweight: true,
        instructions: "Two all-out sets. Chase the rep-PR. Full range, chest to floor.",
        muscleGroups: ["chest", "triceps", "shoulders"],
        caloriesPerSet: 15 },
      { name: "DB Lateral Raise", sets: 3, reps: "15-25", repRange: [15, 25], completed: false,
        instructions: "Light, high rep, lengthened partials. Chase the burn.",
        muscleGroups: ["lateral delts"],
        homeAlt: "15kg or lighter.",
        caloriesPerSet: 6 },
      { name: "DB Curl", sets: 3, reps: "12-20", repRange: [12, 20], completed: false,
        instructions: "High-rep pump. Strict, no swing.",
        muscleGroups: ["biceps"],
        homeAlt: "15kg.",
        caloriesPerSet: 6 },
      { name: "Light Core", sets: 1, reps: "5min", completed: false, isBodyweight: true,
        instructions: "Five continuous minutes: dead bugs, hollow holds, leg raises. Keep it honest.",
        muscleGroups: ["core", "abs"],
        caloriesPerSet: 25 },
    ],
  },
  {
    day: "sunday",
    focus: "Full Rest",
    purpose: "Complete rest. Walk for clarity if you want.",
    morningWalk: true,
    eveningWalk: true,
    isRestDay: true,
    isOptional: true,
    exercises: [],
  },
];

// ============ 90-DAY PERIODISATION ============
// 13 weeks: Base (1-4) -> Build (5-8) -> Deload (9) -> Peak (10-12) -> Deload/Test (13).
// Deload weeks auto-halve working sets. Anchored to the sprint start date.

const SPRINT_WEEKS = 13;

export function getTrainingPhase(
  startDate: string | null | undefined,
  today: string
): PhaseInfo {
  if (!startDate) {
    return { week: 1, day: 1, phase: "base", label: "Base · Week 1", setMultiplier: 1, isDeload: false };
  }

  const dayIndex = Math.max(0, differenceInCalendarDays(parseISO(today), parseISO(startDate)));
  const day = dayIndex + 1;
  const week = Math.min(SPRINT_WEEKS, Math.floor(dayIndex / 7) + 1);

  let phase: TrainingPhase;
  if (week <= 4) phase = "base";
  else if (week <= 8) phase = "build";
  else if (week === 9) phase = "deload";
  else if (week <= 12) phase = "peak";
  else phase = "deload"; // week 13: deload + test

  const isDeload = phase === "deload";
  const labels: Record<TrainingPhase, string> = { base: "Base", build: "Build", deload: "Deload", peak: "Peak" };

  return {
    week,
    day,
    phase,
    label: `${labels[phase]} · Week ${week}`,
    setMultiplier: isDeload ? 0.5 : 1,
    isDeload,
  };
}

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
