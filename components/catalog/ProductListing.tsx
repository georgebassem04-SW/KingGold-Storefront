/**
 * PRODUCT LISTING — the shop view used by /products, /categories/<slug> and search.
 * ------------------------------------------------------------------
 *   [ filters sidebar ]  [ result count · active filter chips · sort ]
 *                        [ product grid ]
 *                        [ pagination ]
 * On phones the sidebar becomes a "Filters" button (MobileFilters.tsx).
 *
 * All filtering/sorting is done by the API (mock: lib/api/mock.ts -> applyFilters),
 * using the filters in the page address (lib/catalog/filters.ts).
 */
import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX, X } from "lucide-react";
import type { Category, Locale } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { api } from "@/lib/api";
import { getSiteTheme } from "@/lib/site-theme";
import { getActiveOffers, targetsProduct } from "@/lib/offers";
import { clientConfig } from "@/config/clients";
import { countActive, PAGE_SIZE, queryToString, toApiFilters, type CatalogQuery } from "@/lib/catalog/filters";
import { fill, formatPrice, t } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterPanel } from "./FilterPanel";
import { MobileFilters } from "./MobileFilters";
import { SortSelect } from "./SortSelect";

interface Props {
  locale: Locale;
  dict: Dictionary;
  query: CatalogQuery;
  /** Page address without filters, e.g. "/ar/products" or "/ar/categories/rings" */
  basePath: string;
  /** Set on a category page: that category is always applied */
  fixedCategory?: Category;
}

export async function ProductListing({ locale, dict, query, basePath, fixedCategory }: Props) {
  const L = dict.catalog;
  const effective: CatalogQuery = fixedCategory ? { ...query, category: fixedCategory.slug } : query;

  const [categories, brands, goldPrices, { filters: filterSettings }, offers, all] = await Promise.all([
    api.getCategories(),
    api.getBrands(),
    api.getGoldPrices(),
    // Which filter sections / categories to show (dashboard → Product filter)
    getSiteTheme(),
    getActiveOffers(),
    // Everything in scope (used to know which karats/metals exist)
    api.getProducts({ categoryId: fixedCategory?.id, pageSize: 500 }),
  ]);

  const filters = toApiFilters(effective, {
    categoryIdBySlug: (s) => categories.find((c) => c.slug === s)?.id,
    brandIdBySlug: (s) => brands.find((b) => b.slug === s)?.id,
  });
  const result = await api.getProducts(filters);
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const activeCount = countActive(effective, !!fixedCategory);

  const availableKarats = [...new Set(all.items.map((p) => p.karat))];
  const availableMetals = [...new Set(all.items.map((p) => p.metal))];
  // Categories in the filter: the ones chosen in the dashboard (in that order), or all main categories
  const chosen = filterSettings.categoryIds.map((id) => categories.find((c) => c.id === id)).filter((c): c is Category => !!c);
  const catOptions = (chosen.length ? chosen : categories.filter((c) => !c.parentId)).map((c) => ({ slug: c.slug, name: t(c.name, locale) }));
  // Is anything here on a special offer? (decides whether the "Special offers" filter shows)
  const hasOffers = offers.length > 0 && all.items.some((p) => offers.some((o) => targetsProduct(o, p.id)));
  const brandOptions = brands.map((b) => ({ slug: b.slug, name: t(b.name, locale) }));
  const price = (n: number) => formatPrice(n, clientConfig.currency, locale);
  const href = (q: CatalogQuery) => `${basePath}${queryToString(fixedCategory ? { ...q, category: undefined } : q)}`;

  const panel = (
    <FilterPanel
      locale={locale}
      query={query}
      labels={L}
      metalLabels={dict.product.metals}
      categories={catOptions}
      brands={brandOptions}
      fixedCategorySlug={fixedCategory?.slug}
      availableKarats={availableKarats}
      availableMetals={availableMetals}
      currencyLabel={clientConfig.currency}
      sections={filterSettings.sections}
      hasOffers={hasOffers}
    />
  );

  // ===== ACTIVE FILTER CHIPS (each one removes its filter) =====
  const chips: { label: string; remove: CatalogQuery }[] = [];
  if (query.q) chips.push({ label: `"${query.q}"`, remove: { ...query, q: undefined } });
  if (!fixedCategory && query.category) {
    const c = categories.find((x) => x.slug === query.category);
    chips.push({ label: c ? t(c.name, locale) : query.category, remove: { ...query, category: undefined } });
  }
  if (query.brand) {
    const b = brands.find((x) => x.slug === query.brand);
    chips.push({ label: b ? t(b.name, locale) : query.brand, remove: { ...query, brand: undefined } });
  }
  query.karat?.forEach((k) => chips.push({ label: `${k}K`, remove: { ...query, karat: query.karat!.filter((x) => x !== k) } }));
  query.metal?.forEach((m) => chips.push({ label: dict.product.metals[m], remove: { ...query, metal: query.metal!.filter((x) => x !== m) } }));
  if (query.min !== undefined || query.max !== undefined)
    chips.push({ label: `${query.min !== undefined ? price(query.min) : "0"} – ${query.max !== undefined ? price(query.max) : "∞"}`, remove: { ...query, min: undefined, max: undefined } });
  if (query.wmin !== undefined || query.wmax !== undefined)
    chips.push({ label: `${query.wmin ?? 0} – ${query.wmax ?? "∞"} ${dict.product.grams}`, remove: { ...query, wmin: undefined, wmax: undefined } });
  if (query.stock) chips.push({ label: L.inStock, remove: { ...query, stock: undefined } });
  if (query.offer) chips.push({ label: L.offers, remove: { ...query, offer: undefined } });

  const cleared: CatalogQuery = { sort: query.sort };

  return (
    <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:block">
        {panel}
      </aside>

      <div className="min-w-0">
        {/* ===== TOOLBAR ===== */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {result.total === 1 ? L.resultsOne : fill(L.results, { count: result.total })}
          </p>
          <div className="flex items-center gap-2">
            <MobileFilters labels={L} activeCount={activeCount} total={result.total}>
              {panel}
            </MobileFilters>
            <SortSelect query={query} labels={L} />
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <Link
                key={c.label}
                href={href({ ...c.remove, page: 1 })}
                scroll={false}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm hover:bg-secondary/70"
              >
                {c.label}
                <X className="size-3.5" />
              </Link>
            ))}
            <Link href={href(cleared)} scroll={false} className="text-sm text-primary underline-offset-4 hover:underline">
              {L.clearAll}
            </Link>
          </div>
        )}

        {/* ===== GRID ===== */}
        {result.items.length ? (
          <div className="product-grid">
            {result.items.map((p) => (
              <ProductCard key={p.id} product={p} goldPrices={goldPrices} locale={locale} dict={dict} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-xl border py-16 text-center">
            <SearchX className="mb-4 size-10 text-muted-foreground" />
            <p className="font-semibold">{L.noResults}</p>
            <p className="mt-1 text-sm text-muted-foreground">{L.noResultsHint}</p>
            {activeCount > 0 && (
              <Button asChild variant="outline" className="mt-6">
                <Link href={href(cleared)}>{L.clearAll}</Link>
              </Button>
            )}
          </div>
        )}

        {/* ===== PAGINATION ===== */}
        {pages > 1 && (
          <Pagination
            page={result.page}
            pages={pages}
            hrefFor={(n) => href({ ...query, page: n })}
            labels={L}
            rtl={locale === "ar"}
          />
        )}
      </div>
    </div>
  );
}

function Pagination({ page, pages, hrefFor, labels, rtl }: { page: number; pages: number; hrefFor: (n: number) => string; labels: Dictionary["catalog"]; rtl: boolean }) {
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);

  return (
    <nav aria-label={fill(labels.page, { page, pages })} className="mt-10 flex items-center justify-center gap-1">
      <PageLink href={hrefFor(page - 1)} disabled={page <= 1} label={labels.prev}><Prev className="size-4" /></PageLink>
      {numbers.map((n, i) => (
        <span key={n} className="flex items-center">
          {i > 0 && numbers[i - 1] !== n - 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Link
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn("flex size-9 items-center justify-center rounded-md text-sm", n === page ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {n}
          </Link>
        </span>
      ))}
      <PageLink href={hrefFor(page + 1)} disabled={page >= pages} label={labels.next}><Next className="size-4" /></PageLink>
    </nav>
  );
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  if (disabled) return <span className="flex size-9 items-center justify-center text-muted-foreground/40" aria-hidden>{children}</span>;
  return (
    <Link href={href} aria-label={label} className="flex size-9 items-center justify-center rounded-md hover:bg-muted">
      {children}
    </Link>
  );
}
