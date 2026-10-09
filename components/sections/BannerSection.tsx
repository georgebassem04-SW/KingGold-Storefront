/**
 * HOMEPAGE BLOCK: BANNER — one wide picture, optionally with text and a button on it (the whole picture is clickable).
 *
 * Where to edit:
 *   - Picture, text, button -> dashboard → Homepage → Wide picture  (sample: mock-data/home.json, "type": "banner")
 *   - Shape                 -> "aspect-[2/1] md:aspect-[4/1]" below (4/1 = 4 times wider than tall; phones use 2/1)
 *   - Shade behind the text -> "bg-black/35" below
 */
import Image from "next/image";
import Link from "next/link";
import type { BannerSection as BannerSectionType } from "@/types";
import { localePath } from "@/i18n/config";
import { t } from "@/lib/format";
import type { SectionProps } from "./types";

export function BannerSection({ section, locale }: SectionProps<BannerSectionType>) {
  const d = section.data;
  const title = d.title ? t(d.title, locale) : "";
  const img = (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl md:aspect-[4/1]">
      <Image src={d.image.url} alt={title} fill sizes="100vw" className="object-cover" />
      {(title || d.cta) && (
        <div className="absolute inset-0 flex flex-col items-start justify-center gap-3 bg-black/35 px-6 text-white md:px-12">
          {title && <p className="max-w-xl text-2xl font-bold md:text-3xl">{title}</p>}
          {d.cta && <span className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{t(d.cta.label, locale)}</span>}
        </div>
      )}
    </div>
  );
  return (
    <section className="mx-auto max-w-7xl px-6 py-6">
      {d.cta ? (
        <Link href={localePath(locale, d.cta.href)} aria-label={t(d.cta.label, locale)}>
          {img}
        </Link>
      ) : (
        img
      )}
    </section>
  );
}
