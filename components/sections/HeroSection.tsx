/**
 * PAGE BLOCK: HERO — the big pictures at the top of a page (homepage or any other), each with optional words and buttons.
 * With more than one slide they change by themselves (HeroSlider.tsx); one slide = a still picture.
 *
 * Where to edit:
 *   - Pictures, titles, buttons -> dashboard → Homepage / Site pages → Main slider  (sample: mock-data/home.json, "type": "hero")
 *   - Where the words and buttons sit, their colours, the shade over the picture
 *                               -> the same place, "Layout & colours" inside each slide (defaults: lib/hero-style.ts)
 *   - Title / text / each button on or off -> the switches at the top of each slide ("What shows on this slide")
 *   - A slide with no title     -> just the picture (and its buttons, if any)
 *   - "Picture for phones"      -> shown on small screens instead of the wide picture (optional)
 *   - Shape                     -> "aspect-[3/4] … md:aspect-[16/7]" in HeroSlider.tsx (phones 3:4, computers 16:7).
 *                                  The SAME shapes are in the dashboard's config/image-frames.ts (heroSlide / heroSlideMobile),
 *                                  so the picture cropped there shows here exactly — change both together
 *   - Seconds per slide         -> SLIDE_SECONDS in HeroSlider.tsx
 *   - Height (original / taller / whole screen) -> dashboard → the slider's "Height" (HEIGHT in HeroSlider.tsx)
 */
import type { HeroSection as HeroSectionType } from "@/types";
import { localePath } from "@/i18n/config";
import { t } from "@/lib/format";
import { parseHeroStyle } from "@/lib/hero-style";
import type { SectionProps } from "./types";
import { HeroSlider } from "./HeroSlider";

export function HeroSection({ section, locale, dict }: SectionProps<HeroSectionType>) {
  const slides = section.data.slides
    .filter((s) => s.image?.url)
    .map((s) => {
      // Positions, colours and on / off switches chosen in the dashboard; anything not chosen = the original design
      const style = parseHeroStyle(s.style, "slide");
      return {
        image: s.image.url,
        mobileImage: s.mobileImage?.url,
        // A part switched off in the dashboard is simply not sent to the slider
        title: style.showTitle ? t(s.title, locale) : "",
        subtitle: style.showText && s.subtitle ? t(s.subtitle, locale) : undefined,
        cta: style.showButton1 && s.cta && t(s.cta.label, locale) ? { label: t(s.cta.label, locale), href: localePath(locale, s.cta.href) } : undefined,
        cta2: style.showButton2 && s.cta2 && t(s.cta2.label, locale) ? { label: t(s.cta2.label, locale), href: localePath(locale, s.cta2.href) } : undefined,
        style,
      };
    });
  if (!slides.length) return null;
  return <HeroSlider slides={slides} height={section.data.height ?? "md"} labels={{ previous: dict.common.previous, next: dict.common.next, slide: dict.common.slide }} />;
}
