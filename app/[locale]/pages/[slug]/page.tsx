/**
 * PAGE: /[locale]/pages/<slug> — ANY custom page created in the dashboard
 * (e.g. /ar/pages/bridal-consultations). No code change needed for new pages:
 * the client creates the page in the dashboard, and it appears at this address.
 *
 * In mock mode, add the JSON file in mock-data/pages/ and register it in lib/api/mock.ts.
 */
import type { Locale } from "@/types";
import { ContentPageView, contentPageMetadata, previewToken } from "@/components/common/ContentPageView";

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/pages/[slug]">) {
  const { locale, slug } = await params;
  return contentPageMetadata(slug, locale as Locale, previewToken(await searchParams));
}

export default async function CustomPage({ params, searchParams }: PageProps<"/[locale]/pages/[slug]">) {
  const { locale, slug } = await params;
  return <ContentPageView slug={slug} locale={locale as Locale} preview={previewToken(await searchParams)} />;
}
