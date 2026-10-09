/**
 * PAGE: /[locale]/categories/<slug> — ONE CATEGORY'S SHOP
 * ------------------------------------------------------------------
 * Banner (image, name, description) + only this category's products, with the same
 * filters, sorting and pagination as /products. From here the customer opens a product,
 * adds it to the cart and checks out as usual.
 * Unknown category -> 404.
 *
 * Category name / image / banner / description -> dashboard → Categories (sample: mock-data/categories.json)
 * Where the title and text sit on the banner, colours, shade, height -> the same form, "Layout & colours"
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseQuery } from "@/lib/catalog/filters";
import { t } from "@/lib/format";
import { ProductListing } from "@/components/catalog/ProductListing";
import { blurCss, overlayCss, parseHeroStyle } from "@/lib/hero-style";
import { HERO_X_CLASS, HERO_Y_CLASS } from "@/components/sections/hero-layout";
import { cn } from "@/lib/utils";

/** Banner heights (small / medium / large). Medium is about the original height */
const HEIGHT = { sm: "min-h-[160px] md:min-h-[200px]", md: "min-h-[240px] md:min-h-[330px]", lg: "min-h-[360px] md:min-h-[480px]" } as const;
/** Title sizes; "md" is the original */
const CATEGORY_TITLE = { sm: "text-2xl md:text-4xl", md: "text-3xl md:text-5xl", lg: "text-4xl md:text-6xl" } as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/categories/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await api.getCategoryBySlug(slug);
  if (!category) return {};
  const l = locale as Locale;
  return {
    title: t(category.name, l),
    description: t(category.description, l) || undefined,
    openGraph: category.banner ? { images: [category.banner.url] } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/[locale]/categories/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const [dict, category, sp] = await Promise.all([getDictionary(locale), api.getCategoryBySlug(slug), searchParams]);
  if (!category) notFound();

  const name = t(category.name, locale);
  // Banner layout chosen in the dashboard; nothing chosen = the original design (lib/hero-style.ts → HERO_DEFAULTS.category)
  const st = parseHeroStyle(category.bannerStyle, "category");
  const banner = category.banner ?? category.image;

  return (
    <>
      {/* ===== BANNER ===== layout (where the words sit, colours, shade, height) from the dashboard → Categories → the category → "Layout & colours" */}
      <section
        // data-overlay-hero (only with a picture): a see-through header (dashboard → Header) may sit on top — see app/globals.css
        data-overlay-hero={banner ? "pad" : undefined}
        className={cn("relative flex overflow-hidden bg-secondary", HEIGHT[category.bannerHeight ?? "md"], banner && "text-white")}
      >
        {banner && (
          <>
            <Image src={banner.url} alt="" fill priority sizes="100vw" className="object-cover" style={blurCss(st)} />
            {st.overlay > 0 && <div className="absolute inset-0" style={{ background: overlayCss(st) }} />}
          </>
        )}
        <div className={cn("relative mx-auto flex w-full max-w-7xl flex-col px-4 py-10 sm:px-6 md:py-14", HERO_X_CLASS[st.x], HERO_Y_CLASS[st.y])} style={{ color: st.textColor || undefined }}>
          <nav aria-label="breadcrumb" className="mb-3 text-sm opacity-80">
            <Link href={`/${locale}`} className="hover:underline">{dict.nav.home}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${locale}/categories`} className="hover:underline">{dict.nav.categories}</Link>
            <span className="mx-2">/</span>
            <span>{name}</span>
          </nav>
          {/* Title switched off: kept for screen readers and Google, just not drawn */}
          <h1 className={st.showTitle ? cn("font-bold", CATEGORY_TITLE[st.titleSize]) : "sr-only"} style={{ color: st.titleColor || undefined }}>{name}</h1>
          {st.showText && category.description && <p className="mt-3 max-w-2xl opacity-90 md:text-lg">{t(category.description, locale)}</p>}
        </div>
      </section>

      {/* ===== THIS CATEGORY'S PRODUCTS ===== */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        <ProductListing
          locale={locale}
          dict={dict}
          query={parseQuery(sp)}
          basePath={`/${locale}/categories/${category.slug}`}
          fixedCategory={category}
        />
      </div>
    </>
  );
}
