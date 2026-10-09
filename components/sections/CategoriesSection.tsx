/**
 * HOMEPAGE BLOCK: CATEGORIES — round images of each category (Rings, Necklaces...).
 *
 * Where to edit:
 *   - Section title                  -> mock-data/home.json (block "categories")
 *   - Only show some categories      -> add "categoryIds": ["cat-rings", ...] to that block
 *   - Category names / images        -> mock-data/categories.json
 *   - Position (right / centre / left) -> dashboard → Homepage → Categories → "Position of the title" and "Position of the pictures"
 *   - How many per row               -> ITEM below (2 on phones, 3 on tablets, 6 on computers)
 *   - Round vs square images         -> "rounded-full" below (use "rounded-lg" for square)
 */
import Image from "next/image";
import Link from "next/link";
import type { CategoriesSection as CategoriesSectionType } from "@/types";
import { api } from "@/lib/api";
import { localePath } from "@/i18n/config";
import { t } from "@/lib/format";
import { SectionTitle } from "@/components/common/SectionTitle";
import { cn } from "@/lib/utils";
import type { SectionProps } from "./types";

/** Position in the row: start = right in Arabic / left in English */
const ALIGN = { start: "justify-start", center: "justify-center", end: "justify-end" } as const;
/** Width of one circle = 2, 3 or 6 per row (the gap between them is 1rem) */
const ITEM = "w-[calc((100%-1rem)/2)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-5rem)/6)]";

export async function CategoriesSection({ section, locale }: SectionProps<CategoriesSectionType>) {
  const all = await api.getCategories();
  const ids = section.data.categoryIds;
  const categories = ids?.length ? all.filter((c) => ids.includes(c.id)) : all;
  const align = section.data.align ?? "start";

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      {/* The title has its own position (nothing chosen = the same side as the circles) */}
      <div className={cn("flex", ALIGN[section.data.titleAlign ?? align])}>
        <SectionTitle title={t(section.data.title, locale)} />
      </div>
      <div className={cn("flex flex-wrap gap-4", ALIGN[align])}>
        {categories.map((c) => (
          <Link key={c.id} href={localePath(locale, `/categories/${c.slug}`)} className={cn("group text-center", ITEM)}>
            <div className="relative aspect-square overflow-hidden rounded-full bg-muted">
              {c.image && (
                <Image src={c.image.url} alt="" fill sizes="160px" className="object-cover group-hover:scale-105 transition-transform" />
              )}
            </div>
            <p className="mt-2 font-medium">{t(c.name, locale)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
