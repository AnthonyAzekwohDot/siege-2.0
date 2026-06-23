import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Real rate limiting for the unauthenticated OpenAI routes, on top of the
// same-origin guard. Two ceilings:
//   - per-IP sliding window: stops a single client hammering the key
//   - global daily cap: the actual money backstop — once the whole app has made
//     N OpenAI calls in 24h, further calls are refused regardless of IP.
// Backed by Supabase (no extra infra). For heavier exposure, swap in an Upstash
// sliding-window keyed by IP; the env-gated upgrade is left as a follow-up.

const PER_IP_LIMIT = 20;
const PER_IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const GLOBAL_DAILY_LIMIT = 200; // total AI calls / 24h across all IPs (money cap)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const db = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

function clientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function tooMany(message: string, retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

/**
 * Enforce the per-IP + global-daily limits for an AI route. Returns a 429 to
 * short-circuit, or null to proceed. Fails OPEN on any limiter error (missing
 * table, transient DB issue) so a limiter bug never bricks the owner's own use
 * — the same-origin guard is still the first line of defence.
 */
export async function enforceRateLimit(request: NextRequest, route: string): Promise<NextResponse | null> {
  if (!db) return null;
  try {
    const ip = clientIp(request);
    const now = Date.now();
    const windowStart = new Date(now - PER_IP_WINDOW_MS).toISOString();
    const dayStart = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const [perIp, globalDay] = await Promise.all([
      db.from("ai_usage").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", windowStart),
      db.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
    ]);

    // Table missing (pre-migration) or transient error → fail open.
    if (perIp.error || globalDay.error) return null;

    if ((globalDay.count ?? 0) >= GLOBAL_DAILY_LIMIT) {
      return tooMany("Daily AI limit reached. Try again tomorrow.", 3600);
    }
    if ((perIp.count ?? 0) >= PER_IP_LIMIT) {
      return tooMany("Too many requests. Slow down.", 600);
    }

    // Record the allowed call (best-effort; ignore write errors).
    await db.from("ai_usage").insert({ id: crypto.randomUUID(), ip, route });
    return null;
  } catch {
    return null;
  }
}
