/**
 * PAGE BLOCK: CALL TO ACTION — a coloured strip with a title and one or two buttons.
 *
 * Where to edit:
 *   - Title, text, buttons -> page JSON (block "cta": "primary" and "secondary" buttons)
 *   - Background -> "background": "primary" (client's main colour), "secondary" (soft), "image" (+ "image") or "video" (+ "video": an mp4 playing silently)
 *   - Small line above the title, words at the start or centre, height -> the same block in the dashboard
 *   - Shade over a picture / video -> "bg-black/35" below
 */
import Image from "next/image";
import Link from "next/link";
import type { CtaSection as CtaSectionType } from "@/types";
import { Button } from "@/components/ui/button";
import { localePath } from "@/i18n/config";
import { t } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SectionProps } from "./types";

/** Strip height when it has a picture / video behind it */
const HEIGHT = { sm: "min-h-[280px]", md: "min-h-[420px]", lg: "min-h-[560px] md:min-h-[640px]" } as const;

export function CtaSection({ section, locale }: SectionProps<CtaSectionType>) {
  const d = section.data;
  const media = d.background === "image" || d.background === "video";
  const onDark = d.background === "primary" || media;
  const start = d.align === "start";
  const eyebrow = d.eyebrow ? t(d.eyebrow, locale) : "";

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div
        className={cn(
          "relative flex flex-col justify-center overflow-hidden rounded-[var(--radius)] px-8 py-14",
          start ? "items-start text-start md:px-16" : "items-center text-center",
          media && HEIGHT[d.height ?? "md"],
          d.background === "primary" && "bg-primary text-primary-foreground",
          d.background === "secondary" && "bg-secondary text-secondary-foreground",
          media && "text-white",
        )}
      >
        {d.background === "image" && d.image && <Image src={d.image.url} alt="" fill sizes="100vw" className="object-cover" />}
        {/* Silent video playing behind the words (dashboard → the block → Background: Video) */}
        {d.background === "video" && d.video?.url && (
          <video src={d.video.url} poster={d.video.posterUrl} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        )}
        {media && <div className="absolute inset-0 bg-black/35" />}
        <div className={cn("relative", start ? "max-w-xl" : "mx-auto max-w-3xl")}>
          {eyebrow && <p className="mb-3 text-sm tracking-[0.15em]">{eyebrow}</p>}
          <h2 className={cn(media ? "text-4xl md:text-6xl" : "text-3xl")}>{t(d.title, locale)}</h2>
          {d.text && <p className={cn("mt-4 opacity-90", start ? "max-w-md" : "mx-auto max-w-xl")}>{t(d.text, locale)}</p>}
          <div className={cn("mt-8 flex flex-wrap gap-3", !start && "justify-center")}>
            {d.primary && (
              <Button asChild size="lg" variant={onDark ? "secondary" : "default"} className={cn(media && "bg-white text-black hover:bg-white/90")}>
                <Link href={localePath(locale, d.primary.href)}>{t(d.primary.label, locale)}</Link>
              </Button>
            )}
            {d.secondary && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className={cn(onDark && "border-current bg-transparent text-current hover:bg-white/10 hover:text-current")}
              >
                <Link href={localePath(locale, d.secondary.href)}>{t(d.secondary.label, locale)}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
