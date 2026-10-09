/**
 * HOMEPAGE BLOCK: COLLECTIONS — a card for each collection (Classic, Bridal…).
 *
 * Where to edit:
 *   - Names, pictures, order, hide, add, delete -> dashboard → Collections
 *   - Section title, which ones show           -> dashboard → Homepage → Collections
 *   - Position (right / centre / left)         -> same place: "Position of the title" and "Position of the collections"
 *   - How many per row                         -> ITEM below (2 on phones, 4 on computers)
 *   - Picture shape                            -> "aspect-[4/3]" below (keep it the same as the dashboard's
 *                                                 config/image-frames.ts → collectionImage)
 * Without the dashboard (sample data): mock-data/home.json (block "brands") and mock-data/brands.json.
 */
import Image from "next/image";
import Link from "next/link";
import type { BrandsSection as BrandsSectionType } from "@/types";
import { api } from "@/lib/api";
import { localePath } from "@/i18n/config";
import { t } from "@/lib/format";
import { SectionTitle } from "@/components/common/SectionTitle";
import { cn } from "@/lib/utils";
import type { SectionProps } from "./types";

/** Position in the row: start = right in Arabic / left in English */
const ALIGN = { start: "justify-start", center: "justify-center", end: "justify-end" } as const;
/** Width of one card = 2 or 4 per row (the gap between them is 1rem) */
const ITEM = "w-[calc((100%-1rem)/2)] md:w-[calc((100%-3rem)/4)]";

export async function BrandsSection({ section, locale }: SectionProps<BrandsSectionType>) {
  const all = await api.getBrands();
  const ids = section.data.brandIds;
  const brands = ids?.length ? all.filter((b) => ids.includes(b.id)) : all;
  const align = section.data.align ?? "start";
  // Pictures are used as soon as one collection has one; the others get an empty frame so the row stays even
  const withPictures = brands.some((b) => b.logo?.url);
  if (!brands.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      {/* The title has its own position (nothing chosen = the same side as the cards) */}
      <div className={cn("flex", ALIGN[section.data.titleAlign ?? align])}>
        <SectionTitle title={t(section.data.title, locale)} />
      </div>
      <div className={cn("flex flex-wrap gap-4", ALIGN[align])}>
        {brands.map((b) =>
          withPictures ? (
            <Link key={b.id} href={localePath(locale, `/products?brand=${b.slug}`)} className={cn("group text-center", ITEM)}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                {b.logo?.url && <Image src={b.logo.url} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform group-hover:scale-105" />}
              </div>
              <p className="mt-2 text-lg font-semibold">{t(b.name, locale)}</p>
            </Link>
          ) : (
            <Link
              key={b.id}
              href={localePath(locale, `/products?brand=${b.slug}`)}
              className={cn("flex h-24 items-center justify-center rounded-lg border text-lg font-semibold hover:border-primary", ITEM)}
            >
              {t(b.name, locale)}
            </Link>
          ),
        )}
      </div>
    </section>
  );
}
