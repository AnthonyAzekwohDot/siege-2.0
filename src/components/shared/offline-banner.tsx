"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Small bar shown only when the device is offline. Pairs with the query
 * client's offlineFirst mutations: writes are queued, not lost, so the user
 * gets honest feedback instead of a save that silently rolls back.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-[hsl(var(--foreground))] px-3 py-1.5 text-center text-xs font-medium text-[hsl(var(--background))]">
      <WifiOff className="h-3.5 w-3.5" />
      Offline. Keep the app open — changes save when you reconnect.
    </div>
  );
}
