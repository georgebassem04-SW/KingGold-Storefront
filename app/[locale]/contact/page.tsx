/**
 * PAGE: /[locale]/contact — Contact Us
 * ------------------------------------------------------------------
 * All content comes from the dashboard page with slug "contact"
 * (API: GET /storefront/pages/contact — in mock mode: mock-data/pages/contact.json).
 *
 * The demo uses three blocks:
 *   page_hero -> title banner + breadcrumb
 *   contact   -> contact channels card (phone, WhatsApp, email, address, hours, social) + the form
 *   branches  -> branch cards with directions and call buttons
 *
 * Form messages go: browser -> /api/contact (app/api/contact/route.ts) -> dashboard.
 * In mock mode they are printed in the terminal running "npm run dev".
 */
import type { Locale } from "@/types";
import { ContentPageView, contentPageMetadata, previewToken } from "@/components/common/ContentPageView";

const SLUG = "contact";

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/contact">) {
  return contentPageMetadata(SLUG, (await params).locale as Locale, previewToken(await searchParams));
}

export default async function ContactPage({ params, searchParams }: PageProps<"/[locale]/contact">) {
  return <ContentPageView slug={SLUG} locale={(await params).locale as Locale} preview={previewToken(await searchParams)} />;
}
