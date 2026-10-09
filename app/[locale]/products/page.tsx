/**
 * PAGE: /[locale]/products — ALL PRODUCTS with filters and sorting
 * ------------------------------------------------------------------
 * Filters are read from the address: ?category=rings&karat=21&min=5000&sort=price_asc …
 * (see lib/catalog/filters.ts). The shop view itself: components/catalog/ProductListing.tsx
 * With ?q=… it works as the search results page.
 * Blocks at the top (hero, banner…): dashboard → Site pages → "Top of: All products" (components/common/ShopPageTop.tsx).
 */
import type { Metadata } from "next";
import type { Locale } from "@/types";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseQuery } from "@/lib/catalog/filters";
import { fill } from "@/lib/format";
import { ProductListing } from "@/components/catalog/ProductListing";
import { loadShopTop, ShopPageTop } from "@/components/common/ShopPageTop";
import { previewToken } from "@/components/common/ContentPageView";

export async function generateMetadata({ params }: PageProps<"/[locale]/products">): Promise<Metadata> {
  const dict = await getDictionary((await params).locale as Locale);
  return { title: dict.pages.products };
}

export default async function ProductsPage({ params, searchParams }: PageProps<"/[locale]/products">) {
  const locale = (await params).locale as Locale;
  const [dict, sp] = await Promise.all([getDictionary(locale), searchParams]);
  const query = parseQuery(sp);
  // The client's own blocks for the top of this page (not shown on search results)
  const top = query.q ? { page: null, hasHero: false } : await loadShopTop("shop-products", previewToken(sp));

  return (
    <>
      <ShopPageTop top={top} locale={locale} dict={dict} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        {/* With a hero / title banner on top, the plain title is not repeated */}
        {!top.hasHero && (
          <h1 className="mb-6 text-2xl font-bold md:text-3xl">
            {query.q ? fill(dict.catalog.searchResults, { q: query.q }) : dict.pages.products}
          </h1>
        )}
        <ProductListing locale={locale} dict={dict} query={query} basePath={`/${locale}/products`} />
      </div>
    </>
  );
}
