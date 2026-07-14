import { NextRequest, NextResponse } from "next/server";
import webPush from "web-push";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CRON_SECRET = process.env.CRON_SECRET!;

// Lazy singletons: creating the Supabase client or setting VAPID details at
// module scope makes the build's page-data collection hard-depend on env. Defer
// both until the handler actually runs.
let _supabase: SupabaseClient | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _supabase;
}

let vapidReady = false;
function ensureVapid() {
  if (vapidReady) return;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error("VAPID keys are not configured");
  }
  // setVapidDetails is idempotent; let a genuine bad-key error propagate rather
  // than mark ready and fail every later send silently.
  webPush.setVapidDetails("mailto:anthonyazekwoh@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidReady = true;
}

// Workout schedule focus by day (0=Sunday, 1=Monday, ... 6=Saturday)
const WORKOUT_FOCUS: Record<number, string> = {
  0: "Rest Walk",
  1: "Chest + Front Delts + Core",
  2: "Walk Only (Active Recovery)",
  3: "Shoulders + Upper Chest + Obliques",
  4: "Walk Only (Metabolic Day)",
  5: "Back + Chest Density + Core",
  6: "Optional Light Sculpting or Walk Only",
};

async function sendToAllSubscriptions(payload: string): Promise<number> {
  ensureVapid();
  const { data: subscriptions, error } = await getSupabase()
    .from("push_subscriptions")
    .select("*");

  if (error || !subscriptions || subscriptions.length === 0) return 0;

  const expiredEndpoints: string[] = [];
  let sent = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const pushError = err as { statusCode?: number };
        if (pushError.statusCode === 404 || pushError.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  if (expiredEndpoints.length > 0) {
    await getSupabase()
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  return sent;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current time in Africa/Lagos
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );
  const dayOfWeek = now.getDay();
  const focus = WORKOUT_FOCUS[dayOfWeek] || "Training Day";
  const isRestDay = [0, 2, 4].includes(dayOfWeek);

  // Daily cron sends morning notifications (workout + weigh-in)
  // Intra-day reminders (meals, water, tonight lock) are handled client-side
  const morningNotifications = [
    {
      type: "workout",
      title: "Siege - Today's Mission",
      body: isRestDay
        ? `Recovery day. ${focus}. Stay moving.`
        : `${focus}. Time to build.`,
      url: "/schedule",
    },
    {
      type: "weigh-in",
      title: "Siege - Morning Weigh-In",
      body: "Step on the scale. Track the trend.",
      url: "/progress",
    },
  ];

  let totalSent = 0;

  for (const notification of morningNotifications) {
    const payload = JSON.stringify(notification);
    const sent = await sendToAllSubscriptions(payload);
    totalSent += sent;
  }

  return NextResponse.json({
    sent: totalSent,
    notifications: morningNotifications.map((n) => n.type),
    day: dayOfWeek,
  });
}
