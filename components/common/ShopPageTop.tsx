/**
 * SHOP PAGE TOP — the blocks the client placed at the top of a shop page (All products, Categories):
 * a hero slider, a title banner, a wide picture, text… or nothing at all.
 * Edited in the dashboard → Site pages → "Top of: All products" / "Top of: Categories" (slugs in lib/site-pages.ts → SHOP_PAGES).
 *
 *   const top = await loadShopTop("shop-products", preview)   // in the page
 *   <ShopPageTop top={top} locale={locale} dict={dict} />      // draws the blocks (nothing when empty)
 *   top.hasHero                                               // true -> the page hides its own plain title
 */
import type { ContentPage, Locale } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { api } from "@/lib/api";
import { SectionRenderer } from "@/components/sections/SectionRenderer";

// Blocks that need today's gold prices (only these trigger the extra request)
const NEEDS_GOLD = new Set(["featured_products", "gold_prices"]);

export interface ShopTop {
  page: ContentPage | null;
  /** A hero slider or a title banner is switched on → it already carries the page's title */
  hasHero: boolean;
}

export async function loadShopTop(slug: string, preview?: string): Promise<ShopTop> {
  // If the dashboard can't be reached the shop page still opens, just without the extra blocks
  const page = await api.getPage(slug, { preview }).catch(() => null);
  const active = page?.sections.filter((s) => s.isActive) ?? [];
  return { page: active.length ? page : null, hasHero: active.some((s) => s.type === "hero" || s.type === "page_hero") };
}

export async function ShopPageTop({ top, locale, dict }: { top: ShopTop; locale: Locale; dict: Dictionary }) {
  if (!top.page) return null;
  const goldPrices = top.page.sections.some((s) => NEEDS_GOLD.has(s.type)) ? await api.getGoldPrices() : [];
  return (
    <>
      {top.page.isPreview && (
        <p role="status" className="sticky top-0 z-40 bg-[#8a6420] px-4 py-2 text-center text-sm font-semibold text-white">
          {dict.pages.previewNotice}
        </p>
      )}
      <SectionRenderer sections={top.page.sections} locale={locale} dict={dict} goldPrices={goldPrices} />
    </>
  );
}
