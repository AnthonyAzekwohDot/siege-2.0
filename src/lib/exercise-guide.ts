// Per-exercise "how to" extras: the single form key (the one cue not to get
// wrong) + a clean search that reliably surfaces a real video demonstration.
// Keyed by the exact name in WORKOUT_SCHEDULE. We link to video rather than
// bundle the free CC0 photo sets — those read as dated gym stock, off-brand.

export interface ExerciseGuide {
  formKey: string;
  videoQuery: string;
}

export const EXERCISE_GUIDE: Record<string, ExerciseGuide> = {
  "Goblet Squat": { formKey: "Sit between your hips, chest tall — don't let it tip forward.", videoQuery: "dumbbell goblet squat proper form" },
  "Goblet Squat (burnout)": { formKey: "Lighter, continuous tension — full depth every rep, chase the burn.", videoQuery: "dumbbell goblet squat proper form" },
  "DB Walking Lunge": { formKey: "Drop the back knee toward the floor; push through the front heel.", videoQuery: "dumbbell walking lunge form" },
  "DB Romanian Deadlift": { formKey: "Push the hips back, soft knees, flat back — feel the hamstring stretch.", videoQuery: "dumbbell romanian deadlift form" },
  "DB Standing Calf Raise": { formKey: "Full stretch at the bottom, pause and squeeze at the top — no bounce.", videoQuery: "dumbbell standing calf raise form" },
  "Dead Bug": { formKey: "Press your lower back flat into the floor the whole time — no arching.", videoQuery: "dead bug core exercise form" },
  "One-Arm DB Row": { formKey: "Pull to your hip, squeeze the shoulder blade — no torso twist.", videoQuery: "one arm dumbbell row form" },
  "Chest-Supported DB Row": { formKey: "Chest stays on the bench; row to the ribs, squeeze the mid-back.", videoQuery: "chest supported dumbbell row form" },
  "DB Overhead Press": { formKey: "Ribs down, don't arch the lower back — press to a full lockout.", videoQuery: "dumbbell overhead press standing form" },
  "DB Reverse Fly": { formKey: "Lead with the elbows, stay light — squeeze the rear delts, strict.", videoQuery: "dumbbell reverse fly rear delt form" },
  "DB Lateral Raise": { formKey: "Lead with the elbows to shoulder height, pause, lower slow — no swing.", videoQuery: "dumbbell lateral raise form" },
  "DB Hammer Curl": { formKey: "Neutral grip (thumbs up), no swinging — control the way down.", videoQuery: "dumbbell hammer curl form" },
  "DB Bulgarian Split Squat": { formKey: "Drop straight down over the front leg; stay upright, knee tracks the toes.", videoQuery: "dumbbell bulgarian split squat form" },
  "Single-Leg DB RDL": { formKey: "Hinge on one leg, flat back — the standing hamstring does the work.", videoQuery: "single leg dumbbell romanian deadlift form" },
  "DB Step-Up": { formKey: "Drive through the TOP leg's heel — minimal push-off from the bottom foot.", videoQuery: "dumbbell step up form" },
  "DB Seated Calf Raise": { formKey: "Dumbbell on the knee, full stretch and squeeze — slow.", videoQuery: "dumbbell seated calf raise form" },
  "Hollow Body Hold": { formKey: "Lower back pressed into the floor; lower the limbs to make it easier.", videoQuery: "hollow body hold form" },
  "DB Floor Press": { formKey: "Elbows touch the floor each rep, press up and together — squeeze the chest.", videoQuery: "dumbbell floor press form" },
  "DB Shoulder Press": { formKey: "Ribs down, press to lockout, control the descent.", videoQuery: "dumbbell shoulder press form" },
  "Incline Press / Push-up AMRAP": { formKey: "Last sets near failure — LOG the rep count, it's a PR you chase.", videoQuery: "feet elevated push up form" },
  "DB Curl": { formKey: "No swing, full range, squeeze at the top, slow on the way down.", videoQuery: "dumbbell biceps curl form" },
  "Skull-Crusher / Diamond Push-up": { formKey: "Elbows stay in and pointed up — only the forearms move.", videoQuery: "dumbbell skull crusher form" },
  "Push-up AMRAP": { formKey: "Full range, chest to the floor — two all-out sets, chase the rep-PR.", videoQuery: "proper push up form" },
  "Light Core": { formKey: "Five continuous minutes — keep it honest, slow and controlled.", videoQuery: "core circuit dead bug hollow hold" },
};

export function exerciseFormKey(name: string): string | null {
  return EXERCISE_GUIDE[name]?.formKey ?? null;
}

export function exerciseVideoUrl(name: string): string {
  const q = EXERCISE_GUIDE[name]?.videoQuery ?? `${name} exercise form`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
