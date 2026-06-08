"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useEffect, useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            // Keep cache long enough that the persisted copy is useful offline.
            gcTime: 24 * 60 * 60 * 1000,
            retry: 1,
            networkMode: "offlineFirst",
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Pause writes when offline instead of failing them, so the
            // optimistic UI is never silently rolled back. They flush on
            // reconnect. This is the fix for "saved... then it vanished".
            networkMode: "offlineFirst",
            retry: 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
          },
        },
      })
  );

  // Persist the query cache to localStorage on the client only. Runs as an
  // effect so SSR stays clean and the provider tree never swaps (no hydration
  // mismatch). Restores on mount, so a refresh on flaky signal keeps your data.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: "siege-query-cache",
    });
    const [unsubscribe] = persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000,
    });
    return () => unsubscribe();
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
