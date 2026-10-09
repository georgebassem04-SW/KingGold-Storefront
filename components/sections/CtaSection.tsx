/**
 * PAGE BLOCK: CALL TO ACTION — a coloured strip with a title and one or two buttons.
 *
 * Where to edit:
 *   - Title, text, buttons -> page JSON (block "cta": "primary" and "secondary" buttons)
 *   - Background -> "background": "primary" (client's main colour), "secondary" (soft), or "image" (+ "image")
 */
import Image from "next/image";
import Link from "next/link";
import type { CtaSection as CtaSectionType } from "@/types";
import { Button } from "@/components/ui/button";
import { localePath } from "@/i18n/config";
import { t } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SectionProps } from "./types";

export function CtaSection({ section, locale }: SectionProps<CtaSectionType>) {
  const d = section.data;
  const onDark = d.background === "primary" || d.background === "image";

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl px-8 py-14 text-center",
          d.background === "primary" && "bg-primary text-primary-foreground",
          d.background === "secondary" && "bg-secondary text-secondary-foreground",
          d.background === "image" && "text-white",
        )}
      >
        {d.background === "image" && d.image && (
          <>
            <Image src={d.image.url} alt="" fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-black/50" />
          </>
        )}
        <div className="relative">
          <h2 className="text-3xl font-bold">{t(d.title, locale)}</h2>
          {d.text && <p className="mx-auto mt-3 max-w-xl opacity-90">{t(d.text, locale)}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {d.primary && (
              <Button asChild size="lg" variant={onDark ? "secondary" : "default"}>
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
