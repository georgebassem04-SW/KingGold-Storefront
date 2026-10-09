/**
 * PAGE BLOCK: PAGE HERO — title banner at the top of a page, with a breadcrumb (Home / About Us).
 *
 * Where to edit (all from the dashboard → the page → "Page title" block):
 *   - Title, subtitle, background picture, up to two buttons — each can be switched on / off ("What shows")
 *   - Height (small / medium / large), breadcrumb on / off
 *   - "Layout & colours": where the words and buttons sit, their colours, the shade over the picture
 *     (defaults = the original design: lib/hero-style.ts → HERO_DEFAULTS.page)
 *   - Heights in pixels -> HEIGHT below
 *   - Without a picture the banner uses the chosen background colour, else the site's soft colour
 */
import Image from "next/image";
import Link from "next/link";
import type { HeroStyle, PageHeroSection as PageHeroSectionType } from "@/types";
import { localePath } from "@/i18n/config";
import { t } from "@/lib/format";
import { blurCss, heroButtonCss, overlayCss, parseHeroStyle } from "@/lib/hero-style";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SectionProps } from "./types";
import { buttonsApart, newTab, HERO_ROW_CLASS, HERO_X_CLASS, HERO_Y_CLASS, TITLE_SIZE } from "./hero-layout";

const HEIGHT = { sm: "min-h-[200px] md:min-h-[240px]", md: "min-h-[320px] md:min-h-[380px]", lg: "min-h-[440px] md:min-h-[560px]" } as const;

export function PageHeroSection({ section, locale, dict }: SectionProps<PageHeroSectionType>) {
  const d = section.data;
  const hasImage = Boolean(d.image?.url);
  const st = parseHeroStyle(d.style, "page");
  const apart = buttonsApart(st);
  // Words are white on a picture; without one they follow the banner's own colour
  const onPicture = st.textColor || (hasImage ? "#ffffff" : "currentColor");
  // Buttons: only the ones switched on in the dashboard (and that have a text)
  const links = [st.showButton1 ? d.cta : undefined, st.showButton2 ? d.cta2 : undefined].map((b) => (b && t(b.label, locale) ? { label: t(b.label, locale), href: localePath(locale, b.href) } : null));

  const buttons = (side: HeroStyle["x"]) =>
    (links[0] || links[1]) && (
      <div className={cn("pointer-events-auto mt-6 flex flex-wrap gap-3", HERO_ROW_CLASS[side])}>
        {links.map(
          (b, i) =>
            b && (
              <Button key={i} asChild size="lg" className="border hover:opacity-90" style={heroButtonCss(i === 0 ? st.button1 : st.button2, onPicture)}>
                <Link href={b.href} {...newTab(b.href)}>
                  {b.label}
                </Link>
              </Button>
            ),
        )}
      </div>
    );

  return (
    // data-overlay-hero (only with a picture): a see-through header (dashboard → Header) may sit on top — see app/globals.css
    <section
      data-overlay-hero={hasImage ? "pad" : undefined}
      className={cn("relative flex overflow-hidden", HEIGHT[d.height ?? "md"], hasImage ? "text-white" : !d.background && "bg-secondary text-secondary-foreground")}
      style={!hasImage && d.background ? { background: d.background } : undefined}
    >
      {hasImage && (
        <>
          <Image src={d.image!.url} alt="" fill priority sizes="100vw" className="object-cover" style={blurCss(st)} />
          {st.overlay > 0 && <div className="absolute inset-0" style={{ background: overlayCss(st) }} />}
        </>
      )}

      {/* WORDS (+ the buttons, unless they have their own place) */}
      <div className={cn("relative mx-auto flex w-full max-w-7xl flex-col px-6 py-12 md:px-10 md:py-16", HERO_X_CLASS[st.x], HERO_Y_CLASS[st.y])} style={{ color: st.textColor || undefined }}>
        {/* Breadcrumb: Home / <page title> */}
        {d.breadcrumb !== false && (
          <nav aria-label="breadcrumb" className="mb-4 text-sm opacity-80">
            <Link href={localePath(locale, "/")} className="hover:underline">
              {dict.nav.home}
            </Link>
            <span className="mx-2">/</span>
            <span>{t(d.title, locale)}</span>
          </nav>
        )}
        {/* Title switched off: kept for screen readers and Google (a page always needs one heading), just not drawn */}
        <h1 className={st.showTitle ? cn("font-bold", TITLE_SIZE[st.titleSize]) : "sr-only"} style={{ color: st.titleColor || undefined }}>
          {t(d.title, locale)}
        </h1>
        {st.showText && d.subtitle && <p className="mt-4 max-w-2xl text-lg opacity-90">{t(d.subtitle, locale)}</p>}
        {!apart && buttons(st.x)}
      </div>

      {/* BUTTONS in their own place */}
      {apart && <div className={cn("pointer-events-none absolute inset-0 mx-auto flex max-w-7xl flex-col px-6 py-8 md:px-10", HERO_X_CLASS[st.bx], HERO_Y_CLASS[st.by])}>{buttons(st.bx)}</div>}
    </section>
  );
}
