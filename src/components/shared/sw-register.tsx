"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/push";

// Intra-day notification schedule (Africa/Lagos times)
const DAILY_REMINDERS = [
  { hour: 8, minute: 30, title: "Siege - Log Breakfast", body: "First meal of the day. Log it now.", tag: "meal" },
  { hour: 13, minute: 0, title: "Siege - Log Lunch", body: "Midday fuel. Log what you ate.", tag: "meal" },
  { hour: 15, minute: 0, title: "Siege - Water Check", body: "How many bottles so far? Stay hydrated.", tag: "water" },
  { hour: 19, minute: 0, title: "Siege - Log Dinner", body: "Last big meal. Log it before you forget.", tag: "meal" },
  { hour: 20, minute: 0, title: "Siege - Tonight Check-In", body: "Kitchen is closing. How did you do today?", tag: "tonight-lock" },
];

function scheduleLocalNotifications() {
  if (Notification.permission !== "granted") return;

  // Get current time in Lagos
  const lagosNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );
  const nowMinutes = lagosNow.getHours() * 60 + lagosNow.getMinutes();

  for (const reminder of DAILY_REMINDERS) {
    const targetMinutes = reminder.hour * 60 + reminder.minute;
    const diffMs = (targetMinutes - nowMinutes) * 60 * 1000;

    // Only schedule future reminders
    if (diffMs > 0) {
      setTimeout(() => {
        if (Notification.permission === "granted") {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(reminder.title, {
              body: reminder.body,
              icon: "/icon-192.png",
              badge: "/icon-192.png",
              tag: reminder.tag,
            } as NotificationOptions);
          });
        }
      }, diffMs);
    }
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker().then((reg) => {
      scheduleLocalNotifications();

      // Poll for SW updates every 60 minutes
      if (reg) {
        setInterval(() => reg.update(), 60 * 60 * 1000);
      }
    });
  }, []);

  return null;
}
