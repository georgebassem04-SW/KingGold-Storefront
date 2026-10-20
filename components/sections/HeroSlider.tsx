/**
 * HERO SLIDER — the moving part of the homepage hero (HeroSection.tsx prepares the data).
 * Changes slide every SLIDE_SECONDS, pauses while the mouse is over it, and stops for visitors who
 * asked their device for less motion. Arrows and dots appear only when there is more than one slide.
 */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroStyle } from "@/types";
import { Button } from "@/components/ui/button";
import { blurCss, heroButtonCss, overlayCss } from "@/lib/hero-style";
import { cn } from "@/lib/utils";
import { buttonsApart, newTab, HERO_ROW_CLASS, HERO_X_CLASS, HERO_Y_CLASS, TITLE_SIZE } from "./hero-layout";

const SLIDE_SECONDS = 6;
/** Slider height (dashboard → the slider → "Height"). "full" = the whole screen (also under a see-through header) */
const HEIGHT = {
  md: "aspect-[3/4] max-h-[80vh] min-h-[380px] md:aspect-[16/7]",
  lg: "aspect-[3/4] max-h-[90vh] min-h-[440px] md:aspect-[16/9]",
  full: "h-[100svh] min-h-[480px]",
} as const;
/** The area words / buttons are placed in: the whole slide, with room at the edges (and for the dots at the bottom) */
const layer = "absolute inset-0 mx-auto flex max-w-7xl flex-col gap-4 px-6 pt-10 pb-14 md:px-16 md:pt-14";

export interface HeroSlide {
  image: string;
  mobileImage?: string;
  title: string;
  subtitle?: string;
  cta?: { label: string; href: string };
  /** Second button, shown next to the first with an outline */
  cta2?: { label: string; href: string };
  /** Where things sit and their colours (dashboard → the slide's "Layout & colours") */
  style: HeroStyle;
}

export function HeroSlider({ slides, labels, height = "md" }: { slides: HeroSlide[]; labels: { previous: string; next: string; slide: string }; height?: keyof typeof HEIGHT }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const many = slides.length > 1;
  const go = (i: number) => setIndex((i + slides.length) % slides.length);

  useEffect(() => {
    if (!many || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [index, many, paused, slides.length]);

  return (
    <section
      // data-overlay-hero: a see-through header (dashboard → Header) may sit on top of this picture — see app/globals.css
      data-overlay-hero=""
      className={cn("relative w-full overflow-hidden", HEIGHT[height])}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => {
        const on = i === index;
        const st = s.style;
        const apart = buttonsApart(st);
        // Only the first slide's title is the page's main heading
        const Title = i === 0 ? "h1" : "h2";
        const onPicture = st.textColor || "#ffffff";
        const buttons = (side: HeroStyle["x"]) =>
          (s.cta || s.cta2) && (
            <div className={cn("pointer-events-auto flex flex-wrap gap-3", HERO_ROW_CLASS[side])}>
              {s.cta && (
                <Button asChild size="lg" className="border hover:opacity-90" style={heroButtonCss(st.button1, onPicture)}>
                  <Link href={s.cta.href} tabIndex={on ? undefined : -1} {...newTab(s.cta.href)}>
                    {s.cta.label}
                  </Link>
                </Button>
              )}
              {s.cta2 && (
                <Button asChild size="lg" className="border hover:opacity-90" style={heroButtonCss(st.button2, onPicture)}>
                  <Link href={s.cta2.href} tabIndex={on ? undefined : -1} {...newTab(s.cta2.href)}>
                    {s.cta2.label}
                  </Link>
                </Button>
              )}
            </div>
          );
        return (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${labels.slide} ${i + 1} / ${slides.length}`}
            aria-hidden={!on}
            className={cn("absolute inset-0 transition-opacity duration-700", on ? "opacity-100" : "pointer-events-none opacity-0")}
          >
            <Image src={s.image} alt="" fill priority={i === 0} sizes="100vw" className={cn("object-cover", s.mobileImage && "hidden md:block")} style={blurCss(st)} />
            {s.mobileImage && <Image src={s.mobileImage} alt="" fill priority={i === 0} sizes="100vw" className="object-cover md:hidden" style={blurCss(st)} />}
            {/* Shade over the picture (strength and colour from the dashboard) */}
            {st.overlay > 0 && <div className="absolute inset-0" style={{ background: overlayCss(st) }} />}

            {/* WORDS (+ the buttons, unless they have their own place) */}
            <div className={cn(layer, HERO_X_CLASS[st.x], HERO_Y_CLASS[st.y])} style={{ color: st.textColor || "#ffffff" }}>
              {s.title && <Title className={cn("max-w-3xl", TITLE_SIZE[st.titleSize])} style={{ color: st.titleColor || undefined }}>{s.title}</Title>}
              {s.subtitle && <p className="max-w-2xl text-lg opacity-90">{s.subtitle}</p>}
              {!apart && buttons(st.x)}
            </div>
            {/* BUTTONS in their own place */}
            {apart && <div className={cn(layer, "pointer-events-none", HERO_X_CLASS[st.bx], HERO_Y_CLASS[st.by])}>{buttons(st.bx)}</div>}
          </div>
        );
      })}

      {many && (
        <>
          <button type="button" aria-label={labels.previous} onClick={() => go(index - 1)} className="absolute top-1/2 start-3 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 md:flex">
            <ChevronLeft className="size-6 rtl:rotate-180" />
          </button>
          <button type="button" aria-label={labels.next} onClick={() => go(index + 1)} className="absolute top-1/2 end-3 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 md:flex">
            <ChevronRight className="size-6 rtl:rotate-180" />
          </button>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1">
            {slides.map((_, i) => (
              <button key={i} type="button" aria-label={`${labels.slide} ${i + 1}`} aria-current={i === index} onClick={() => go(i)} className="flex size-6 items-center justify-center">
                <span className={cn("h-2 rounded-full bg-white transition-all", i === index ? "w-6" : "w-2 opacity-60")} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
