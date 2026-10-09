/**
 * FILTER PANEL (browser) — category, special offers, price range, karat, metal, weight, collection, in-stock.
 * ------------------------------------------------------------------
 * Every change updates the address bar (lib/catalog/filters.ts) and the list refreshes.
 * Shown as a sidebar on desktop and inside a slide-in panel on phones (MobileFilters.tsx).
 *
 * Where to edit:
 *   - Which sections show, their order, which categories are listed -> the dashboard → "Product filter"
 *                                                                      (saved in theme.filters, defaults: lib/theme-chrome.ts)
 *   - Which karats / metals are offered -> KARATS / METALS in lib/catalog/filters.ts
 *   - Texts (AR/EN)                     -> i18n/dictionaries/*.json -> "catalog"
 *   - How one section looks             -> the `blocks` list below (one entry per section)
 */
"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import type { FilterSection, Karat, Locale, Metal } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { KARATS, METALS, type CatalogQuery } from "@/lib/catalog/filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCatalogNav } from "./useCatalogNav";

export interface FilterOption {
  slug: string;
  name: string;
}

interface Props {
  locale: Locale;
  query: CatalogQuery;
  labels: Dictionary["catalog"];
  metalLabels: Dictionary["product"]["metals"];
  categories: FilterOption[];
  brands: FilterOption[];
  /** On a category page the category is fixed: show other categories as links instead */
  fixedCategorySlug?: string;
  /** Which karats / metals actually exist in the shop (others are hidden) */
  availableKarats: Karat[];
  availableMetals: Metal[];
  currencyLabel: string;
  /** Sections to show, in order (dashboard → Product filter) */
  sections: FilterSection[];
  /** true when at least one product here has a special offer (otherwise the "Special offers" section is hidden) */
  hasOffers: boolean;
}

export function FilterPanel(props: Props) {
  const { locale, query, labels, metalLabels, categories, brands, fixedCategorySlug, availableKarats, availableMetals, currencyLabel, sections, hasOffers } = props;
  const { update, isPending } = useCatalogNav(query);

  const toggle = <T,>(list: T[] | undefined, value: T) =>
    list?.includes(value) ? list.filter((x) => x !== value) : [...(list ?? []), value];

  // One entry per section. null = nothing to show (e.g. the shop has a single karat)
  const blocks: Record<FilterSection, React.ReactNode> = {
    /* ===== CATEGORY ===== */
    category: categories.length > 0 && (
      <FilterGroup title={fixedCategorySlug ? labels.otherCategories : labels.category}>
        <ul className="space-y-1">
          {!fixedCategorySlug && (
            <li>
              <OptionButton active={!query.category} onClick={() => update({ category: undefined })}>{labels.allCategories}</OptionButton>
            </li>
          )}
          {categories.map((c) => (
            <li key={c.slug}>
              {fixedCategorySlug ? (
                <Link
                  href={`/${locale}/categories/${c.slug}`}
                  className={cn("block rounded-md px-2 py-1.5 hover:bg-muted", c.slug === fixedCategorySlug && "bg-secondary font-semibold")}
                >
                  {c.name}
                </Link>
              ) : (
                <OptionButton active={query.category === c.slug} onClick={() => update({ category: c.slug })}>{c.name}</OptionButton>
              )}
            </li>
          ))}
        </ul>
      </FilterGroup>
    ),

    /* ===== SPECIAL OFFERS (only while an offer is running) ===== */
    offers: (hasOffers || !!query.offer) && (
      <FilterGroup title={labels.offers}>
        <Checkbox checked={!!query.offer} onChange={() => update({ offer: !query.offer || undefined })}>
          <span className="flex items-center gap-2">
            {labels.offersOnly}
            <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white">%</span>
          </span>
        </Checkbox>
      </FilterGroup>
    ),

    /* ===== PRICE ===== */
    price: (
      <FilterGroup title={`${labels.price} (${currencyLabel})`}>
        <RangeInputs min={query.min} max={query.max} labels={labels} onApply={(min, max) => update({ min, max })} />
      </FilterGroup>
    ),

    /* ===== KARAT ===== */
    karat: availableKarats.length > 1 && (
      <FilterGroup title={labels.karat}>
        <div className="flex flex-wrap gap-2">
          {KARATS.filter((k) => availableKarats.includes(k)).map((k) => (
            <Chip key={k} active={!!query.karat?.includes(k)} onClick={() => update({ karat: toggle(query.karat, k) })}>
              {k}K
            </Chip>
          ))}
        </div>
      </FilterGroup>
    ),

    /* ===== METAL ===== */
    metal: availableMetals.length > 1 && (
      <FilterGroup title={labels.metal}>
        <div className="space-y-2">
          {METALS.filter((m) => availableMetals.includes(m)).map((m) => (
            <Checkbox key={m} checked={!!query.metal?.includes(m)} onChange={() => update({ metal: toggle(query.metal, m) })}>
              {metalLabels[m]}
            </Checkbox>
          ))}
        </div>
      </FilterGroup>
    ),

    /* ===== WEIGHT ===== */
    weight: (
      <FilterGroup title={labels.weight}>
        <RangeInputs min={query.wmin} max={query.wmax} labels={labels} step="0.1" onApply={(wmin, wmax) => update({ wmin, wmax })} />
      </FilterGroup>
    ),

    /* ===== COLLECTION ===== */
    collection: brands.length > 0 && (
      <FilterGroup title={labels.collection}>
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <Chip key={b.slug} active={query.brand === b.slug} onClick={() => update({ brand: query.brand === b.slug ? undefined : b.slug })}>
              {b.name}
            </Chip>
          ))}
        </div>
      </FilterGroup>
    ),

    /* ===== IN STOCK ===== */
    stock: (
      <section className="border-b pb-6 last:border-0">
        <Checkbox checked={!!query.stock} onChange={() => update({ stock: !query.stock || undefined })}>
          {labels.inStock}
        </Checkbox>
      </section>
    ),
  };

  return (
    <div className={cn("space-y-6 text-sm transition-opacity", isPending && "opacity-60")}>
      {sections.map((key) => blocks[key] && <Fragment key={key}>{blocks[key]}</Fragment>)}
    </div>
  );
}

/* ---------- building blocks ---------- */

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b pb-6 last:border-0">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("w-full rounded-md px-2 py-1.5 text-start hover:bg-muted", active && "bg-secondary font-semibold")}
    >
      {children}
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary",
      )}
    >
      {children}
    </button>
  );
}

function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-[var(--primary)]" />
      {children}
    </label>
  );
}

/** Two number boxes (from / to) + Apply. Also applies on Enter. */
function RangeInputs({ min, max, labels, step = "1", onApply }: {
  min?: number;
  max?: number;
  labels: Dictionary["catalog"];
  step?: string;
  onApply: (min?: number, max?: number) => void;
}) {
  const [from, setFrom] = useState(min?.toString() ?? "");
  const [to, setTo] = useState(max?.toString() ?? "");
  // Keep the boxes in step when filters are cleared elsewhere (chips, "Clear all")
  useEffect(() => setFrom(min?.toString() ?? ""), [min]);
  useEffect(() => setTo(max?.toString() ?? ""), [max]);

  const parse = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? undefined : Math.max(0, Number(v)));
  const apply = () => {
    let a = parse(from);
    let b = parse(to);
    if (a !== undefined && b !== undefined && a > b) [a, b] = [b, a]; // swap if typed backwards
    onApply(a, b);
  };

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <Input type="number" inputMode="decimal" min="0" step={step} placeholder={labels.min} value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" aria-label={labels.min} />
      <span className="text-muted-foreground">–</span>
      <Input type="number" inputMode="decimal" min="0" step={step} placeholder={labels.max} value={to} onChange={(e) => setTo(e.target.value)} className="h-9" aria-label={labels.max} />
      <Button type="submit" size="sm" variant="outline" className="h-9">{labels.apply}</Button>
    </form>
  );
}
