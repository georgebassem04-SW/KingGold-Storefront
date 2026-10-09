/**
 * PAGE: /[locale]/categories — ALL CATEGORIES
 * A card per category (image, name, number of pieces). Clicking opens that category's shop page.
 * Data: GET /storefront/categories (mock: mock-data/categories.json). Order = "sortOrder".
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { getDictionary } from "@/i18n/get-dictionary";
import { fill, t } from "@/lib/format";
import { loadShopTop, ShopPageTop } from "@/components/common/ShopPageTop";
import { previewToken } from "@/components/common/ContentPageView";

export async function generateMetadata({ params }: PageProps<"/[locale]/categories">): Promise<Metadata> {
  const dict = await getDictionary((await params).locale as Locale);
  return { title: dict.pages.categories };
}

export default async function CategoriesPage({ params, searchParams }: PageProps<"/[locale]/categories">) {
  const locale = (await params).locale as Locale;
  // top = the client's own blocks for the top of this page: dashboard → Site pages → "Top of: Categories"
  const [dict, categories, all, top] = await Promise.all([getDictionary(locale), api.getCategories(), api.getProducts({ pageSize: 500 }), loadShopTop("shop-categories", previewToken(await searchParams))]);
  const count = (id: string) => all.items.filter((p) => p.categoryId === id).length;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <>
    <ShopPageTop top={top} locale={locale} dict={dict} />
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12">
      {/* With a hero / title banner on top, the plain title is not repeated */}
      {!top.hasHero && (
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">{dict.catalog.categoriesTitle}</h1>
          <p className="mt-2 text-muted-foreground">{dict.catalog.categoriesSubtitle}</p>
        </header>
      )}

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {categories.filter((c) => !c.parentId).map((c) => (
          <Link key={c.id} href={`/${locale}/categories/${c.slug}`} className="group relative block overflow-hidden rounded-xl bg-muted">
            <div className="relative aspect-[4/5] sm:aspect-[4/3]">
              {c.image && (
                <Image src={c.image.url} alt="" fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
              <h2 className="text-lg font-bold sm:text-2xl">{t(c.name, locale)}</h2>
              <p className="mt-1 flex items-center gap-2 text-xs opacity-90 sm:text-sm">
                {fill(dict.catalog.productsCount, { count: count(c.id) })}
                <span className="hidden items-center gap-1 font-medium sm:inline-flex">
                  · {dict.catalog.shopNow} <Arrow className="size-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
    </>
  );
}
