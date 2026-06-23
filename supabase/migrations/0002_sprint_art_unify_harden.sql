-- Siege Engines migration (0002): Sprint · Unify · Art/Mind · Harden.
-- Run ONCE in the Supabase SQL editor. Idempotent, additive, no data loss.
-- Self-sufficient: it also (re)applies the 0001 workout-engine columns, so if
-- you only ever run this file, the whole app's schema is covered.

-- ---- 0001 workout engine (included so this file stands alone) ----
ALTER TABLE daily_logs    ADD COLUMN IF NOT EXISTS exercise_logs JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sprint_start_date TEXT;

-- ---- 1) Sprint engine: goal weight + protein floor on the profile ----
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS goal_weight_kg  REAL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS protein_floor_g INTEGER;

-- ---- 2) Art/Mind: Day-0 / 45 / 90 benchmark captures ----
CREATE TABLE IF NOT EXISTS art_benchmarks (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  checkpoint   INTEGER NOT NULL,           -- 0 | 45 | 90
  prompt_id    TEXT NOT NULL,
  artefact_url TEXT NOT NULL,
  note         TEXT,
  taken_on     TEXT NOT NULL,              -- yyyy-MM-dd
  created_at   TEXT NOT NULL DEFAULT now()::text
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_art_benchmarks_cp_prompt
  ON art_benchmarks(checkpoint, prompt_id);
ALTER TABLE art_benchmarks ENABLE ROW LEVEL SECURITY;
-- Read + insert + update (the upsert needs update); deliberately NO delete.
DROP POLICY IF EXISTS "Allow all for art_benchmarks" ON art_benchmarks;
DROP POLICY IF EXISTS "art_benchmarks read"   ON art_benchmarks;
DROP POLICY IF EXISTS "art_benchmarks insert" ON art_benchmarks;
DROP POLICY IF EXISTS "art_benchmarks update" ON art_benchmarks;
CREATE POLICY "art_benchmarks read"   ON art_benchmarks FOR SELECT USING (true);
CREATE POLICY "art_benchmarks insert" ON art_benchmarks FOR INSERT WITH CHECK (true);
CREATE POLICY "art_benchmarks update" ON art_benchmarks FOR UPDATE USING (true) WITH CHECK (true);

-- ---- 3) Harden: AI-usage log that backs the rate limiter ----
CREATE TABLE IF NOT EXISTS ai_usage (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ip         TEXT NOT NULL,
  route      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created    ON ai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_ip_created ON ai_usage(ip, created_at);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
-- Append-only: the limiter may READ + INSERT, but NOT delete/update. This stops
-- anyone with the public anon key from wiping the log to reset the daily money
-- cap. (They could still insert junk to throttle the owner, but never to spend.)
DROP POLICY IF EXISTS "Allow all for ai_usage" ON ai_usage;
DROP POLICY IF EXISTS "ai_usage read"   ON ai_usage;
DROP POLICY IF EXISTS "ai_usage insert" ON ai_usage;
CREATE POLICY "ai_usage read"   ON ai_usage FOR SELECT USING (true);
CREATE POLICY "ai_usage insert" ON ai_usage FOR INSERT WITH CHECK (true);

-- ---- 4) Art/Mind: public storage bucket for artefact photos ----
-- Public bucket capped at 6MB, images only (bounds the storage-abuse blast radius).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('artefacts', 'artefacts', true, 6291456,
        ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 6291456,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif'];

-- Public read; anon may INSERT new artefacts (random-UUID paths) but NOT
-- overwrite existing ones — the app always writes a fresh path, so no UPDATE is
-- needed, and dropping it removes the defacement vector.
DROP POLICY IF EXISTS "artefacts public read" ON storage.objects;
CREATE POLICY "artefacts public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'artefacts');

DROP POLICY IF EXISTS "artefacts anon insert" ON storage.objects;
CREATE POLICY "artefacts anon insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artefacts');

-- Explicitly remove any prior anon UPDATE policy (no overwrites of existing objects).
DROP POLICY IF EXISTS "artefacts anon update" ON storage.objects;
