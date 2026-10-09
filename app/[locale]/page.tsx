/**
 * HOME PAGE — /ar or /en
 * The homepage has no fixed content: it draws the blocks set in the dashboard → Homepage, in their order
 * (sample-data mode without the dashboard: mock-data/home.json). See components/sections/SectionRenderer.tsx.
 * ?preview=<token> (from the dashboard's "Preview" button) shows the unpublished draft to staff, with a notice bar.
 */
import { api } from "@/lib/api";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/types";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { previewToken } from "@/components/common/ContentPageView";

/** Home page = whatever sections the dashboard sends, in the order it sends them */
export default async function HomePage({ params, searchParams }: PageProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  const preview = previewToken(await searchParams);
  const [dict, home, goldPrices] = await Promise.all([getDictionary(locale), api.getHomePage(preview ? { preview } : undefined), api.getGoldPrices()]);

  return (
    <>
      {home.isPreview && (
        <p role="status" className="sticky top-0 z-40 bg-[#8a6420] px-4 py-2 text-center text-sm font-semibold text-white">
          {dict.pages.previewNotice}
        </p>
      )}
      <SectionRenderer sections={home.sections} locale={locale} dict={dict} goldPrices={goldPrices} />
    </>
  );
}
