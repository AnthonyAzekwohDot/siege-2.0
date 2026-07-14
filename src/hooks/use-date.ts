"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

const today = () => format(new Date(), "yyyy-MM-dd");

/** The current local date (yyyy-MM-dd), kept live. If the app is left open
 *  across midnight — or backgrounded and resumed the next day — it recomputes
 *  on focus, visibility change, and a 60s tick, so logging never silently
 *  targets yesterday. */
export function useToday(): string {
  const [date, setDate] = useState(today);
  useEffect(() => {
    const sync = () => setDate((prev) => {
      const now = today();
      return now === prev ? prev : now;
    });
    const id = setInterval(sync, 60_000);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return date;
}

export function useDate() {
  const [date, setDate] = useState(today);
  return { date, setDate };
}
