/**
 * PAGE: /[locale]/about — About Us
 * ------------------------------------------------------------------
 * All content comes from the dashboard page with slug "about"
 * (API: GET /storefront/pages/about — in mock mode: mock-data/pages/about.json).
 *
 * The page is a list of blocks the client arranges in the dashboard. The demo uses:
 *   page_hero  -> title banner + breadcrumb
 *   image_text -> "Our story" text with a photo
 *   stats      -> big numbers (years, branches, designs, customers)
 *   features   -> "Why choose us" icon grid
 *   timeline   -> history by year
 *   rich_text  -> mission & vision (formatted text)
 *   branches   -> branch cards (from GET /storefront/branches)
 *   cta        -> closing strip with buttons
 *
 * To change the text, images or order of blocks: edit mock-data/pages/about.json
 * (set "isActive": false to hide a block, change "sortOrder" to move it).
 * To change how a block LOOKS: components/sections/<Name>Section.tsx
 */
import type { Locale } from "@/types";
import { ContentPageView, contentPageMetadata, previewToken } from "@/components/common/ContentPageView";

// The page's slug in the dashboard
const SLUG = "about";

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/about">) {
  return contentPageMetadata(SLUG, (await params).locale as Locale, previewToken(await searchParams));
}

export default async function AboutPage({ params, searchParams }: PageProps<"/[locale]/about">) {
  return <ContentPageView slug={SLUG} locale={(await params).locale as Locale} preview={previewToken(await searchParams)} />;
}
