/**
 * PROVIDERS — wraps the whole app with shared tools that run in the browser.
 * Currently: TanStack Query (fetching + caching data in the browser).
 *   - staleTime 60_000 = data is considered fresh for 60 seconds before re-fetching.
 * You rarely need to edit this file.
 */
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/** App-wide client providers. TanStack Query handles client-side fetching + caching (cart re-pricing, account pages, search). */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
