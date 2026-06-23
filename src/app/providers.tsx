"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 1,
            networkMode: "offlineFirst",
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Pause writes while offline instead of failing them, so the
            // optimistic UI is never rolled back on flaky signal. react-query
            // resumes paused mutations automatically on reconnect while the app
            // stays open. (A full durable cross-reload write queue —
            // persist + resumePausedMutations + mutationKey defaults — is a
            // deliberate next step; we do NOT persist optimistic writes here,
            // so the UI never claims a save that did not happen.)
            networkMode: "offlineFirst",
            retry: 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
