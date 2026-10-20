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
 *   - Circles or tiles (name on the picture), edge to edge -> dashboard → Homepage → Categories → "Look"
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

/** Tiles: 2 per row on phones, 4 on computers */
const TILE = "w-1/2 lg:w-1/4";

export async function CategoriesSection({ section, locale }: SectionProps<CategoriesSectionType>) {
  const all = await api.getCategories();
  const ids = section.data.categoryIds;
  // Chosen categories keep the order they were ticked in; none chosen = all, in the Categories page order
  const categories = ids?.length ? ids.map((id) => all.find((c) => c.id === id)).filter((c): c is (typeof all)[number] => !!c) : all;
  const align = section.data.align ?? "start";
  const tiles = section.data.style === "tiles";
  const full = tiles && section.data.fullWidth;
  const eyebrow = section.data.eyebrow ? t(section.data.eyebrow, locale) : "";

  return (
    <section className={cn("py-12", full ? "w-full" : "mx-auto max-w-7xl px-6")}>
      {/* The title has its own position (nothing chosen = the same side as the pictures) */}
      <div className={cn("flex flex-col", { start: "items-start", center: "items-center text-center", end: "items-end text-end" }[section.data.titleAlign ?? align], full && "px-6")}>
        {eyebrow && <p className="mb-1 text-sm tracking-wide opacity-80">{eyebrow}</p>}
        <SectionTitle title={t(section.data.title, locale)} center={(section.data.titleAlign ?? align) === "center"} />
      </div>

      {tiles ? (
        // TILES: square pictures with the name on them (dashboard → the block → "Look")
        <div className={cn("flex flex-wrap", full ? "gap-0" : "-mx-1.5", ALIGN[align])}>
          {categories.map((c) => (
            <Link key={c.id} href={localePath(locale, `/categories/${c.slug}`)} className={cn("group", TILE, !full && "p-1.5")}>
              <div className="relative aspect-square overflow-hidden bg-muted">
                {c.image && <Image src={c.image.url} alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
                {/* Soft shade at the bottom so the white name stays readable */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
                <p className="heading-font absolute inset-x-2 bottom-4 text-center text-base text-white md:text-lg">{t(c.name, locale)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        // CIRCLES (original look)
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
      )}
    </section>
  );
}
