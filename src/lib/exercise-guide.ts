// Per-exercise "describe the movement" extras: the single form key (the one cue
// not to get wrong) + the movement pattern (paired with the muscle map). Keyed
// by the exact name in WORKOUT_SCHEDULE. No external video link, the sheet
// describes the lift in-app (muscle map + movement + cues).

export interface ExerciseGuide {
  formKey: string;
  movement: string;
}

export const EXERCISE_GUIDE: Record<string, ExerciseGuide> = {
  "Goblet Squat": { formKey: "Sit between your hips, chest tall, don't let it tip forward.", movement: "Knee-dominant squat" },
  "Goblet Squat (burnout)": { formKey: "Lighter, continuous tension, full depth every rep, chase the burn.", movement: "Knee-dominant squat" },
  "DB Walking Lunge": { formKey: "Drop the back knee toward the floor; push through the front heel.", movement: "Single-leg lunge" },
  "DB Romanian Deadlift": { formKey: "Push the hips back, soft knees, flat back, feel the hamstring stretch.", movement: "Hip hinge" },
  "DB Standing Calf Raise": { formKey: "Full stretch at the bottom, pause and squeeze at the top, no bounce.", movement: "Calf raise" },
  "Dead Bug": { formKey: "Press your lower back flat into the floor the whole time, no arching.", movement: "Core anti-extension" },
  "One-Arm DB Row": { formKey: "Pull to your hip, squeeze the shoulder blade, no torso twist.", movement: "Horizontal pull" },
  "Chest-Supported DB Row": { formKey: "Chest stays on the bench; row to the ribs, squeeze the mid-back.", movement: "Horizontal pull" },
  "DB Overhead Press": { formKey: "Ribs down, don't arch the lower back, press to a full lockout.", movement: "Vertical press" },
  "DB Reverse Fly": { formKey: "Lead with the elbows, stay light, squeeze the rear delts, strict.", movement: "Rear-delt raise" },
  "DB Lateral Raise": { formKey: "Lead with the elbows to shoulder height, pause, lower slow, no swing.", movement: "Lateral raise" },
  "DB Hammer Curl": { formKey: "Neutral grip (thumbs up), no swinging, control the way down.", movement: "Elbow flexion (curl)" },
  "DB Bulgarian Split Squat": { formKey: "Drop straight down over the front leg; stay upright, knee tracks the toes.", movement: "Single-leg split squat" },
  "Single-Leg DB RDL": { formKey: "Hinge on one leg, flat back, the standing hamstring does the work.", movement: "Single-leg hip hinge" },
  "DB Step-Up": { formKey: "Drive through the TOP leg's heel, minimal push-off from the bottom foot.", movement: "Single-leg step-up" },
  "DB Seated Calf Raise": { formKey: "Dumbbell on the knee, full stretch and squeeze, slow.", movement: "Calf raise (seated)" },
  "Hollow Body Hold": { formKey: "Lower back pressed into the floor; lower the limbs to make it easier.", movement: "Core anti-extension (hold)" },
  "DB Floor Press": { formKey: "Elbows touch the floor each rep, press up and together, squeeze the chest.", movement: "Horizontal press" },
  "DB Shoulder Press": { formKey: "Ribs down, press to lockout, control the descent.", movement: "Vertical press" },
  "Incline Press / Push-up AMRAP": { formKey: "Last sets near failure, LOG the rep count, it's a PR you chase.", movement: "Incline press" },
  "DB Curl": { formKey: "No swing, full range, squeeze at the top, slow on the way down.", movement: "Elbow flexion (curl)" },
  "Skull-Crusher / Diamond Push-up": { formKey: "Elbows stay in and pointed up, only the forearms move.", movement: "Elbow extension (triceps)" },
  "Push-up AMRAP": { formKey: "Full range, chest to the floor, two all-out sets, chase the rep-PR.", movement: "Horizontal press (bodyweight)" },
  "Light Core": { formKey: "Five continuous minutes, keep it honest, slow and controlled.", movement: "Core circuit" },
};

export function exerciseFormKey(name: string): string | null {
  return EXERCISE_GUIDE[name]?.formKey ?? null;
}

export function exerciseMovement(name: string): string | null {
  return EXERCISE_GUIDE[name]?.movement ?? null;
}
