-- Siege 2.0 Database Schema for Supabase
-- Run this in the Supabase SQL Editor to set up your tables

-- Daily fitness logs
CREATE TABLE IF NOT EXISTS daily_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date TEXT NOT NULL UNIQUE,
  steps INTEGER NOT NULL DEFAULT 0,
  steps_goal INTEGER NOT NULL DEFAULT 15000,
  meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  calories_goal INTEGER NOT NULL DEFAULT 2400,
  fruit_eaten BOOLEAN NOT NULL DEFAULT false,
  completed_exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  exercise_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  morning_walk_completed BOOLEAN NOT NULL DEFAULT false,
  evening_walk_completed BOOLEAN NOT NULL DEFAULT false,
  water_bottles INTEGER NOT NULL DEFAULT 0,
  water_goal INTEGER NOT NULL DEFAULT 7
);

-- Creative training logs
CREATE TABLE IF NOT EXISTS mind_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date TEXT NOT NULL UNIQUE,
  entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_block_id TEXT,
  timer_started_at TEXT,
  minimum_win_mode BOOLEAN NOT NULL DEFAULT false
);

-- User profile for TDEE calculations
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY DEFAULT 'default-user',
  weight_kg INTEGER NOT NULL DEFAULT 151,
  height_cm INTEGER NOT NULL DEFAULT 183,
  age INTEGER NOT NULL DEFAULT 25,
  sex TEXT NOT NULL DEFAULT 'male',
  activity_level TEXT NOT NULL DEFAULT 'light',
  deficit_target INTEGER NOT NULL DEFAULT 1500,
  has_asthma BOOLEAN NOT NULL DEFAULT false,
  last_insight_date TEXT,
  weekly_insight_count INTEGER NOT NULL DEFAULT 0,
  insight_week_start TEXT,
  tonight_lock_time TEXT NOT NULL DEFAULT '20:00',
  tonight_lock_enabled BOOLEAN NOT NULL DEFAULT true,
  last_tonight_lock_date TEXT,
  safe_meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  walk_presets JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TEXT NOT NULL DEFAULT now()::text
);

-- Daily nutrition summaries with TDEE snapshots
CREATE TABLE IF NOT EXISTS daily_nutrition_summaries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date TEXT NOT NULL UNIQUE,
  tdee_snapshot INTEGER NOT NULL,
  deficit_target_snapshot INTEGER NOT NULL,
  exertions JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Create indexes for date-based queries
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_mind_logs_date ON mind_logs(date);
CREATE INDEX IF NOT EXISTS idx_nutrition_summaries_date ON daily_nutrition_summaries(date);

-- Row Level Security (disabled for single-user app, enable if adding auth)
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_summaries ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (single-user app)
CREATE POLICY "Allow all for daily_logs" ON daily_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for mind_logs" ON mind_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for user_profiles" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for daily_nutrition_summaries" ON daily_nutrition_summaries FOR ALL USING (true) WITH CHECK (true);

-- Add weight tracking to daily logs
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS weight_kg REAL;
