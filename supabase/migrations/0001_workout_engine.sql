-- Siege Workout Engine migration
-- Run once in the Supabase SQL editor (idempotent, instant, safe).
--
-- Adds:
--   daily_logs.exercise_logs   - per-set log { exerciseName: SetEntry[] }, the
--                                progressive-overload record (load/reps/done per set).
--   user_profiles.sprint_start_date - day-0 of the 90-day sprint; anchors the
--                                training phase/week (base/build/deload/peak).

ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS exercise_logs JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS sprint_start_date TEXT;
