/**
 * HOMEPAGE BLOCK: PROMOTION — a box with text + button on one side and an image on the other.
 *
 * Where to edit:
 *   - Title, description, image, button, end date -> dashboard → Homepage → Offer  (sample: mock-data/home.json, "promotion")
 *   - After the end date ("endsAt") the block hides by itself; before it, "Offer ends …" is shown
 *   - Box background colour             -> the client's "secondary" colour (bg-secondary)
 *   - Image height                      -> "min-h-[260px]" below
 */
import Image from "next/image";
import Link from "next/link";
import type { PromotionSection as PromotionSectionType } from "@/types";
import { Button } from "@/components/ui/button";
import { localePath } from "@/i18n/config";
import { t } from "@/lib/format";
import { connection } from "next/server";
import { fill } from "@/lib/format";
import type { SectionProps } from "./types";

export async function PromotionSection({ section, locale, dict }: SectionProps<PromotionSectionType>) {
  const d = section.data;
  if (d.endsAt) {
    await connection(); // decided on every visit, not when the page was cached
    if (Date.parse(d.endsAt) < Date.now()) return null;
  }
  const ends = d.endsAt ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { day: "numeric", month: "long" }).format(new Date(d.endsAt)) : null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid overflow-hidden rounded-xl bg-secondary md:grid-cols-2">
        <div className="flex flex-col justify-center gap-4 p-10">
          <h2 className="text-3xl font-bold">{t(d.title, locale)}</h2>
          {d.description && <p className="text-muted-foreground">{t(d.description, locale)}</p>}
          {ends && <p className="text-sm font-semibold text-primary">{fill(dict.common.offerEnds, { date: ends })}</p>}
          {d.cta && (
            <Button asChild className="w-fit">
              <Link href={localePath(locale, d.cta.href)}>{t(d.cta.label, locale)}</Link>
            </Button>
          )}
        </div>
        {d.image && (
          <div className="relative min-h-[260px]">
            <Image src={d.image.url} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
