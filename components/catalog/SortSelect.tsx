/** "Sort by" dropdown above the product grid. Options' texts: dictionaries -> "catalog.sort" */
"use client";

import type { Dictionary } from "@/i18n/get-dictionary";
import { SORTS, type CatalogQuery, type SortKey } from "@/lib/catalog/filters";
import { NativeSelect } from "@/components/ui/native-select";
import { useCatalogNav } from "./useCatalogNav";

export function SortSelect({ query, labels }: { query: CatalogQuery; labels: Dictionary["catalog"] }) {
  const { update } = useCatalogNav(query);
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted-foreground sm:inline">{labels.sortBy}</span>
      <NativeSelect
        aria-label={labels.sortBy}
        className="h-9 w-auto min-w-40"
        value={query.sort ?? "newest"}
        onChange={(e) => update({ sort: e.target.value as SortKey })}
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>{labels.sort[s]}</option>
        ))}
      </NativeSelect>
    </label>
  );
}
