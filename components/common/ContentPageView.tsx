/**
 * CONTENT PAGE VIEW — draws any page built in the dashboard page editor
 * (About, FAQ, Terms, custom pages). Used by app/[locale]/about/page.tsx and
 * app/[locale]/pages/[slug]/page.tsx.
 *
 * How it works:
 *   1. Loads the page by its slug from the API (mock-data/pages/<slug>.json in mock mode)
 *   2. Not found or still a draft -> 404 page
 *   3. Draws its blocks in order with the same engine as the homepage (SectionRenderer)
 *
 * You don't edit page CONTENT here — edit it in the dashboard → Site pages (mock: mock-data/pages/<slug>.json).
 *
 * PREVIEW: the dashboard's "Preview" button opens the page with ?preview=<token>. The token is checked by the
 * dashboard / API, which then sends the unpublished draft. A gold strip at the top says it's a preview,
 * and search engines are told not to index it.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { getDictionary } from "@/i18n/get-dictionary";
import { t } from "@/lib/format";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { SHOP_PAGES } from "@/lib/site-pages";
import { PageShell } from "@/components/common/PageShell";

// Blocks that need today's gold prices (only these trigger the extra request)
const NEEDS_GOLD = new Set(["featured_products", "gold_prices"]);

/** Browser title, Google description and share image, from the page's SEO fields in the dashboard */
export async function contentPageMetadata(slug: string, locale: Locale, preview?: string): Promise<Metadata> {
  const page = await api.getPage(slug, { preview });
  if (!page) return {};
  const image = page.seo?.image?.url;
  return {
    title: t(page.seo?.title ?? page.title, locale),
    description: t(page.seo?.description, locale) || undefined,
    openGraph: image ? { images: [image] } : undefined,
    robots: preview ? { index: false, follow: false } : undefined,
  };
}

/** Reads ?preview=… from the page address (only a string of reasonable length is passed on) */
export const previewToken = (sp: Record<string, string | string[] | undefined>) => {
  const v = sp.preview;
  return typeof v === "string" && v.length < 2000 ? v : undefined;
};

export async function ContentPageView({ slug, locale, preview }: { slug: string; locale: Locale; preview?: string }) {
  // "Top of All products / Categories" are not pages by themselves (they show on the shop pages)
  if (slug in SHOP_PAGES) notFound();
  const page = await api.getPage(slug, { preview });
  if (!page) notFound();

  const needsGold = page.sections.some((s) => NEEDS_GOLD.has(s.type));
  const [dict, goldPrices] = await Promise.all([getDictionary(locale), needsGold ? api.getGoldPrices() : []]);

  // If the page doesn't start with a title banner, show a simple title so the page is never untitled
  const hasHero = page.sections.some((s) => (s.type === "page_hero" || s.type === "hero") && s.isActive);

  return (
    <>
      {page.isPreview && (
        <p role="status" className="sticky top-0 z-40 bg-[#8a6420] px-4 py-2 text-center text-sm font-semibold text-white">
          {dict.pages.previewNotice}
        </p>
      )}
      {!hasHero && <PageShell title={t(page.title, locale)} />}
      <SectionRenderer sections={page.sections} locale={locale} dict={dict} goldPrices={goldPrices} />
    </>
  );
}
