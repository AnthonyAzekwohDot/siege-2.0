-- 0003: web-push subscriptions.
--
-- This table lives in supabase-schema.sql but was never added as a migration,
-- so it was never applied to the live DB. Result: the Settings notifications
-- toggle, saveSubscription(), and the daily-notifications cron all wrote/read a
-- non-existent table and silently did nothing. Additive + idempotent.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT now()::text
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for push_subscriptions" ON push_subscriptions;
CREATE POLICY "Allow all for push_subscriptions" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
