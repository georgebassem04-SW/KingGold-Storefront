/**
 * PRODUCT FILTERS <-> URL
 * ------------------------------------------------------------------
 * Filters live in the page address, e.g.
 *   /ar/products?karat=21,18&metal=yellow_gold&min=5000&max=40000&sort=price_asc&page=2
 * so a filtered list can be shared, bookmarked, and the browser Back button works.
 *
 *   parseFilters(searchParams)  -> the filters the API understands (ProductFilters)
 *   filtersToQuery(state)       -> back to "?karat=21&…"
 *
 * URL names:  q · category · brand · karat · metal · min · max · wmin · wmax · stock · offer · sort · page
 * To add a filter: add it to CatalogQuery, parse it here, send it to the API, and add a control in ProductFilters.tsx
 */
import type { Karat, Metal, ProductFilters } from "@/types";

export const PAGE_SIZE = 12;

export const SORTS = ["newest", "price_asc", "price_desc", "weight_asc", "weight_desc"] as const;
export type SortKey = (typeof SORTS)[number];
export const KARATS: Karat[] = [24, 22, 21, 18, 14];
export const METALS: Metal[] = ["yellow_gold", "white_gold", "rose_gold", "platinum", "silver"];

/** Filters as they appear in the URL (all optional) */
export interface CatalogQuery {
  q?: string;
  category?: string; // category slug
  brand?: string; // collection slug
  karat?: Karat[];
  metal?: Metal[];
  min?: number;
  max?: number;
  wmin?: number;
  wmax?: number;
  stock?: boolean;
  /** Only products on a special offer */
  offer?: boolean;
  sort?: SortKey;
  page?: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | string[] | undefined) => {
  const n = Number(one(v));
  return Number.isFinite(n) && n >= 0 && one(v) !== "" ? n : undefined;
};
const list = <T extends string | number>(v: string | string[] | undefined, allowed: readonly T[]) =>
  (one(v) ?? "")
    .split(",")
    .map((x) => (typeof allowed[0] === "number" ? Number(x) : x) as T)
    .filter((x) => allowed.includes(x));

/** Reads the URL safely: unknown or broken values are ignored */
export function parseQuery(params: RawParams): CatalogQuery {
  const sort = one(params.sort) as SortKey | undefined;
  const karat = list(params.karat, KARATS);
  const metal = list(params.metal, METALS);
  return {
    q: one(params.q)?.trim().slice(0, 80) || undefined,
    category: one(params.category) || undefined,
    brand: one(params.brand) || undefined,
    karat: karat.length ? karat : undefined,
    metal: metal.length ? metal : undefined,
    min: num(params.min),
    max: num(params.max),
    wmin: num(params.wmin),
    wmax: num(params.wmax),
    stock: one(params.stock) === "1" || undefined,
    offer: one(params.offer) === "1" || undefined,
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    page: Math.max(1, Math.floor(num(params.page) ?? 1)),
  };
}

/** URL filters -> API filters. Slugs are turned into ids with the category / collection lists. */
export function toApiFilters(
  q: CatalogQuery,
  lookups: { categoryIdBySlug: (slug: string) => string | undefined; brandIdBySlug: (slug: string) => string | undefined },
): ProductFilters {
  return {
    search: q.q,
    categoryId: q.category ? lookups.categoryIdBySlug(q.category) ?? "__none__" : undefined,
    brandId: q.brand ? lookups.brandIdBySlug(q.brand) ?? "__none__" : undefined,
    karat: q.karat,
    metal: q.metal,
    minPrice: q.min,
    maxPrice: q.max,
    minWeight: q.wmin,
    maxWeight: q.wmax,
    inStockOnly: q.stock,
    onOffer: q.offer,
    sort: q.sort ?? "newest",
    page: q.page ?? 1,
    pageSize: PAGE_SIZE,
  };
}

/** CatalogQuery -> "?karat=21,18&sort=price_asc" (empty values are left out) */
export function queryToString(q: CatalogQuery): string {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.category) p.set("category", q.category);
  if (q.brand) p.set("brand", q.brand);
  if (q.karat?.length) p.set("karat", q.karat.join(","));
  if (q.metal?.length) p.set("metal", q.metal.join(","));
  if (q.min !== undefined) p.set("min", String(q.min));
  if (q.max !== undefined) p.set("max", String(q.max));
  if (q.wmin !== undefined) p.set("wmin", String(q.wmin));
  if (q.wmax !== undefined) p.set("wmax", String(q.wmax));
  if (q.stock) p.set("stock", "1");
  if (q.offer) p.set("offer", "1");
  if (q.sort && q.sort !== "newest") p.set("sort", q.sort);
  if (q.page && q.page > 1) p.set("page", String(q.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Number of active filters (shown on the mobile "Filters (3)" button) */
export function countActive(q: CatalogQuery, ignoreCategory = false): number {
  return (
    (q.q ? 1 : 0) +
    (q.category && !ignoreCategory ? 1 : 0) +
    (q.brand ? 1 : 0) +
    (q.karat?.length ?? 0) +
    (q.metal?.length ?? 0) +
    (q.min !== undefined || q.max !== undefined ? 1 : 0) +
    (q.wmin !== undefined || q.wmax !== undefined ? 1 : 0) +
    (q.stock ? 1 : 0) +
    (q.offer ? 1 : 0)
  );
}
