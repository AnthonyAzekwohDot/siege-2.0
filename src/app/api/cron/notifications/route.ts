import { NextRequest, NextResponse } from "next/server";
import webPush from "web-push";
import { createClient } from "@supabase/supabase-js";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CRON_SECRET = process.env.CRON_SECRET!;

webPush.setVapidDetails(
  "mailto:anthonyazekwoh@gmail.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

interface ScheduledNotification {
  hour: number;
  minute: number;
  type: string;
  title: string;
  body: string;
  url: string;
}

function getScheduledNotifications(dayOfWeek: number): ScheduledNotification[] {
  const focus = WORKOUT_FOCUS[dayOfWeek] || "Training Day";
  const isRestDay = [0, 2, 4].includes(dayOfWeek);

  const notifications: ScheduledNotification[] = [
    {
      hour: 6,
      minute: 0,
      type: "workout",
      title: "Siege - Today's Mission",
      body: isRestDay
        ? `Recovery day. ${focus}. Stay moving.`
        : `${focus}. Time to build.`,
      url: "/schedule",
    },
    {
      hour: 7,
      minute: 0,
      type: "weigh-in",
      title: "Siege - Morning Weigh-In",
      body: "Step on the scale. Track the trend.",
      url: "/progress",
    },
    {
      hour: 8,
      minute: 30,
      type: "meal",
      title: "Siege - Log Breakfast",
      body: "First meal of the day. Log it now.",
      url: "/nutrition",
    },
    {
      hour: 13,
      minute: 0,
      type: "meal",
      title: "Siege - Log Lunch",
      body: "Midday fuel. Log what you ate.",
      url: "/nutrition",
    },
    {
      hour: 15,
      minute: 0,
      type: "water",
      title: "Siege - Water Check",
      body: "How many bottles so far? Stay hydrated.",
      url: "/",
    },
    {
      hour: 19,
      minute: 0,
      type: "meal",
      title: "Siege - Log Dinner",
      body: "Last big meal. Log it before you forget.",
      url: "/nutrition",
    },
    {
      hour: 20,
      minute: 0,
      type: "tonight-lock",
      title: "Siege - Tonight Check-In",
      body: "Kitchen is closing. How did you do today?",
      url: "/",
    },
  ];

  return notifications;
}

function isWithinWindow(
  nowHour: number,
  nowMinute: number,
  targetHour: number,
  targetMinute: number,
  windowMinutes: number = 30
): boolean {
  const nowTotal = nowHour * 60 + nowMinute;
  const targetTotal = targetHour * 60 + targetMinute;
  return nowTotal >= targetTotal && nowTotal < targetTotal + windowMinutes;
}

async function sendToAllSubscriptions(payload: string): Promise<number> {
  const { data: subscriptions, error } = await supabase
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
    await supabase
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
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...

  const scheduled = getScheduledNotifications(dayOfWeek);
  const toSend = scheduled.filter((n) =>
    isWithinWindow(hour, minute, n.hour, n.minute)
  );

  if (toSend.length === 0) {
    return NextResponse.json({
      message: "No notifications due",
      time: `${hour}:${String(minute).padStart(2, "0")}`,
      day: dayOfWeek,
    });
  }

  let totalSent = 0;

  for (const notification of toSend) {
    const payload = JSON.stringify({
      type: notification.type,
      title: notification.title,
      body: notification.body,
      url: notification.url,
    });

    const sent = await sendToAllSubscriptions(payload);
    totalSent += sent;
  }

  return NextResponse.json({
    sent: totalSent,
    notifications: toSend.map((n) => n.type),
    time: `${hour}:${String(minute).padStart(2, "0")}`,
    day: dayOfWeek,
  });
}
