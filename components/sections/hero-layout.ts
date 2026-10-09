/**
 * HERO LAYOUT CLASSES — turns the positions chosen in the dashboard (lib/hero-style.ts) into Tailwind classes.
 * Used by HeroSlider.tsx (homepage slider) and PageHeroSection.tsx (page title banner).
 *
 *   X (across): start = the reading-start side (right in Arabic, left in English) · center · end
 *   Y (up / down): top · middle · bottom
 * To change a title size, edit TITLE_SIZE below.
 */
import type { HeroStyle } from "@/types";

export const HERO_X_CLASS = { start: "items-start text-start", center: "items-center text-center", end: "items-end text-end" } as const;
export const HERO_Y_CLASS = { top: "justify-start", middle: "justify-center", bottom: "justify-end" } as const;
/** Buttons row follows the same side as its block */
export const HERO_ROW_CLASS = { start: "justify-start", center: "justify-center", end: "justify-end" } as const;
export const TITLE_SIZE = { sm: "text-3xl md:text-4xl", md: "text-4xl md:text-5xl", lg: "text-5xl md:text-6xl" } as const;

/** Buttons get their own place only when it differs from the words' place (same place = under the words) */
export const buttonsApart = (s: HeroStyle) => s.buttons === "own" && !(s.bx === s.x && s.by === s.y);

/** Buttons that leave the site (WhatsApp chat, another website) open in a new tab; site pages, calls and emails don't */
export const newTab = (href: string) => (/^https?:\/\//i.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});
