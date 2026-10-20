/**
 * PAGE BLOCK: IMAGE + TEXT — text on one side, a photo on the other (e.g. "Our story").
 *
 * Where to edit:
 *   - Small line, title, text (HTML), image, button -> page JSON (block "image_text")
 *   - Which side the image is on -> "imagePosition": "start" or "end"
 *       start = left in English / right in Arabic;  end = the opposite
 *   - Image shape -> "aspect-[4/5]" below (try aspect-square or aspect-video)
 *   - Look: "card" (gap between picture and text) or "split" (touching, framed text panel, centred) -> dashboard → the block → "Look"
 */
import Image from "next/image";
import Link from "next/link";
import type { ImageTextSection as ImageTextSectionType } from "@/types";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/common/RichText";
import { localePath } from "@/i18n/config";
import { t } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SectionProps } from "./types";

export function ImageTextSection({ section, locale }: SectionProps<ImageTextSectionType>) {
  const d = section.data;
  const imageOrder = cn(d.imagePosition === "start" && "md:order-first", d.imagePosition === "end" && "md:order-last");

  // SPLIT: picture and a framed text panel touching each other, words centred (dashboard → the block → "Look")
  if (d.layout === "split") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid md:grid-cols-2">
          <div className={cn("relative aspect-[4/5] overflow-hidden bg-muted md:aspect-auto md:min-h-[560px]", imageOrder)}>
            <Image src={d.image.url} alt={t(d.image.alt, locale)} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="flex flex-col items-center justify-center border border-foreground/10 px-8 py-12 text-center md:px-14">
            {d.eyebrow && <p className="mb-2 text-sm tracking-wide opacity-80">{t(d.eyebrow, locale)}</p>}
            <h2 className="mb-6 text-3xl md:text-4xl">{t(d.title, locale)}</h2>
            <RichText html={t(d.body, locale)} className="max-w-md text-sm leading-7 opacity-80" />
            {d.cta && (
              <Button asChild className="mt-8">
                <Link href={localePath(locale, d.cta.href)}>{t(d.cta.label, locale)}</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        {/* Image — "order-first" puts it on the start side on desktop */}
        <div className={cn("relative aspect-[4/5] overflow-hidden rounded-xl bg-muted", imageOrder)}>
          <Image src={d.image.url} alt={t(d.image.alt, locale)} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </div>

        {/* Text */}
        <div>
          {d.eyebrow && <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">{t(d.eyebrow, locale)}</p>}
          <h2 className="mb-6 text-3xl md:text-4xl">{t(d.title, locale)}</h2>
          <RichText html={t(d.body, locale)} className="text-muted-foreground" />
          {d.cta && (
            <Button asChild className="mt-8">
              <Link href={localePath(locale, d.cta.href)}>{t(d.cta.label, locale)}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
