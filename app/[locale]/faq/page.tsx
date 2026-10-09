/**
 * PAGE: /[locale]/faq — FAQ (questions shown as an accordion)
 * ------------------------------------------------------------------
 * All content comes from the dashboard page with slug "faq"
 * (dashboard → Site pages; API: GET /storefront/pages/faq — in mock mode: mock-data/pages/faq.json).
 * The page is built from blocks the client arranges in the dashboard, drawn by ContentPageView.
 */
import type { Locale } from "@/types";
import { ContentPageView, contentPageMetadata, previewToken } from "@/components/common/ContentPageView";

const SLUG = "faq";

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/faq">) {
  return contentPageMetadata(SLUG, (await params).locale as Locale, previewToken(await searchParams));
}

export default async function FaqPage({ params, searchParams }: PageProps<"/[locale]/faq">) {
  return <ContentPageView slug={SLUG} locale={(await params).locale as Locale} preview={previewToken(await searchParams)} />;
}
