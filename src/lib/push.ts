import { supabase } from "@/lib/supabase";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

// ============ Helpers ============

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ============ Service Worker Registration ============

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js?v=2", {
      scope: "/",
    });
    console.log("Service worker registered");
    return registration;
  } catch (err) {
    console.error("Service worker registration failed:", err);
    return null;
  }
}

// ============ Push Subscription ============

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("PushManager" in window)) {
    console.warn("Push API not supported");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Notification permission denied");
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  try {
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    await saveSubscription(subscription);
    return subscription;
  } catch (err) {
    console.error("Push subscription failed:", err);
    // Roll back the browser subscription if the DB save failed, so the Settings
    // toggle can't report "enabled" off a phantom that no server knows about.
    try {
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
    } catch {
      /* best-effort cleanup */
    }
    return null;
  }
}

// ============ Save to Supabase ============

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const raw = subscription.toJSON();
  const endpoint = raw.endpoint!;
  const keys_p256dh = raw.keys?.p256dh ?? "";
  const keys_auth = raw.keys?.auth ?? "";

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      id: crypto.randomUUID(),
      endpoint,
      keys_p256dh,
      keys_auth,
      created_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("Failed to save push subscription:", error);
    throw error;
  }
}

// ============ Unsubscribe ============

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;

    await subscription.unsubscribe();

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) {
      console.error("Failed to remove push subscription:", error);
    }
  }
}

// ============ Check current state ============

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}
