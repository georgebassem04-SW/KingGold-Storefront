/**
 * Changes the filters in the address bar (browser side).
 * The page re-renders on the server with the new filters — no full reload.
 */
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { queryToString, type CatalogQuery } from "@/lib/catalog/filters";

export function useCatalogNav(current: CatalogQuery) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  /** Apply changes; any filter change goes back to page 1 */
  function update(changes: Partial<CatalogQuery>, { keepPage = false } = {}) {
    const next: CatalogQuery = { ...current, ...changes };
    if (!keepPage) next.page = 1;
    startTransition(() => router.push(`${pathname}${queryToString(next)}`, { scroll: false }));
  }

  return { update, isPending };
}
