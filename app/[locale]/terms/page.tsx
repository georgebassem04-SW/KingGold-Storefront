/**
 * PAGE: /[locale]/terms — Terms & conditions
 * ------------------------------------------------------------------
 * All content comes from the dashboard page with slug "terms"
 * (dashboard → Site pages; API: GET /storefront/pages/terms — in mock mode: mock-data/pages/terms.json).
 * The page is built from blocks the client arranges in the dashboard, drawn by ContentPageView.
 */
import type { Locale } from "@/types";
import { ContentPageView, contentPageMetadata, previewToken } from "@/components/common/ContentPageView";

const SLUG = "terms";

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/terms">) {
  return contentPageMetadata(SLUG, (await params).locale as Locale, previewToken(await searchParams));
}

export default async function TermsPage({ params, searchParams }: PageProps<"/[locale]/terms">) {
  return <ContentPageView slug={SLUG} locale={(await params).locale as Locale} preview={previewToken(await searchParams)} />;
}
