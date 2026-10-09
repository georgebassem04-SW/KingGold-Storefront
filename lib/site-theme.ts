/**
 * SITE THEME — the look of the website, as set in the dashboard (Theme & design).
 * ------------------------------------------------------------------
 *   const theme = await getSiteTheme();
 *
 * 1) Starts from this client's defaults (config/clients/<client>.ts)
 * 2) Asks the API for the PUBLISHED theme (lib/api → getTheme)
 * 3) Anything missing or broken in the API answer keeps the default
 * Read once per page request (React cache), so calling it in many components is free.
 *
 * Used by: app/[locale]/layout.tsx (colours, fonts, sizes, logo, favicon), the Header and Footer,
 * i18n/get-dictionary.ts (text changes) and the order email.
 */
import "server-only";
import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import type { ArabicFont, LatinFont, SiteTheme } from "@/types";
import { ARABIC_FONTS, LATIN_FONTS } from "@/types";
import { clientConfig } from "@/config/clients";
import { api } from "@/lib/api";
import { DEFAULT_FILTERS, DEFAULT_FOOTER, DEFAULT_HEADER, DEFAULT_PRODUCT_PAGE, parseFilters, parseDarkMode, parseFooter, parseHeader, parseProductPage, suggestedDarkColors } from "@/lib/theme-chrome";

/** The client's own settings, in theme form — used whenever the dashboard hasn't set something */
export function defaultSiteTheme(): SiteTheme {
  const c = clientConfig.theme.colors;
  const f = clientConfig.theme.fonts;
  const radiusPx = Math.round(parseFloat(clientConfig.theme.radius) * (clientConfig.theme.radius.endsWith("rem") ? 16 : 1)) || 8;
  return {
    brand: {
      name: clientConfig.name,
      tagline: clientConfig.tagline ?? { ar: "", en: "" },
      logo: clientConfig.branding.logo,
      logoOnDark: clientConfig.branding.logoDark ?? "",
      logoShape: "square",
      favicon: clientConfig.branding.favicon ?? "",
      shareImage: "",
    },
    colors: { ...c, card: c.background, danger: "#B42318" },
    // Dark mode is off until the dashboard switches it on (Theme & design → Dark mode)
    darkMode: { enabled: false, default: "light", colors: suggestedDarkColors({ ...c, card: c.background, danger: "#B42318" }) },
    typography: {
      arabicFont: f.arabic,
      arabicHeadingFont: f.arabic,
      latinFont: f.latin,
      latinHeadingFont: f.headingLatin ?? f.latin,
      baseSize: 16,
      headingWeight: 700,
      lineHeight: 1.6,
      headingLetterSpacing: 0,
    },
    layout: {
      containerWidth: 1280,
      radius: radiusPx,
      stickyHeader: true,
      breadcrumbs: true,
      productCard: clientConfig.layout.productCard,
      productImageRatio: "square",
      gridColumns: clientConfig.layout.gridColumns,
    },
    // Top bar and footer options (dashboard → Header / Footer). Defaults = the original design
    header: structuredClone(DEFAULT_HEADER),
    filters: structuredClone(DEFAULT_FILTERS),
    productPage: structuredClone(DEFAULT_PRODUCT_PAGE),
    footer: structuredClone(DEFAULT_FOOTER),
    texts: { ar: {}, en: {} },
  };
}

const HEX = /^#[0-9a-f]{6}$/i;
const num = (v: unknown, min: number, max: number, fallback: number) => (typeof v === "number" && v >= min && v <= max ? v : fallback);
const oneOf = <T,>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);
const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
/** Only same-site paths or http(s) addresses — never "javascript:" or other tricks */
const url = (v: unknown, fallback: string) =>
  typeof v === "string" && (v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\/[^\s"'<>]+$/.test(v)) ? v : fallback;

/** Combines the API theme with the defaults, checking every value (a bad value never breaks the site) */
export function mergeTheme(base: SiteTheme, incoming: Partial<SiteTheme> | null | undefined): SiteTheme {
  if (!incoming || typeof incoming !== "object") return base;
  const b = incoming.brand ?? ({} as Partial<SiteTheme["brand"]>);
  const c = (incoming.colors ?? {}) as Partial<Record<keyof SiteTheme["colors"], unknown>>;
  const ty = incoming.typography ?? ({} as Partial<SiteTheme["typography"]>);
  const l = incoming.layout ?? ({} as Partial<SiteTheme["layout"]>);

  const colors = { ...base.colors };
  for (const k of Object.keys(colors) as (keyof SiteTheme["colors"])[]) {
    if (typeof c[k] === "string" && HEX.test(c[k] as string)) colors[k] = c[k] as string;
  }
  const texts = (lang: "ar" | "en") => {
    const src = incoming.texts?.[lang];
    if (!src || typeof src !== "object") return {};
    return Object.fromEntries(Object.entries(src).filter(([k, v]) => /^[\w.]+$/.test(k) && typeof v === "string" && v.length <= 600));
  };

  return {
    brand: {
      name: { ar: str(b.name?.ar, base.brand.name.ar) || base.brand.name.ar, en: str(b.name?.en, base.brand.name.en) || base.brand.name.en },
      tagline: { ar: str(b.tagline?.ar, base.brand.tagline.ar), en: str(b.tagline?.en, base.brand.tagline.en) },
      logo: url(b.logo, base.brand.logo) || base.brand.logo,
      logoOnDark: url(b.logoOnDark, base.brand.logoOnDark),
      logoShape: b.logoShape === "wide" ? "wide" : "square",
      favicon: url(b.favicon, base.brand.favicon),
      shareImage: url(b.shareImage, base.brand.shareImage),
    },
    colors,
    // Dark mode (dashboard → Theme & design → Dark mode); a missing dark colour gets a suggested one
    darkMode: parseDarkMode(incoming.darkMode, colors),
    typography: {
      arabicFont: oneOf<ArabicFont>(ty.arabicFont, ARABIC_FONTS, base.typography.arabicFont),
      arabicHeadingFont: oneOf<ArabicFont>(ty.arabicHeadingFont, ARABIC_FONTS, base.typography.arabicHeadingFont),
      latinFont: oneOf<LatinFont>(ty.latinFont, LATIN_FONTS, base.typography.latinFont),
      latinHeadingFont: oneOf<LatinFont>(ty.latinHeadingFont, LATIN_FONTS, base.typography.latinHeadingFont),
      baseSize: num(ty.baseSize, 14, 18, base.typography.baseSize),
      headingWeight: oneOf(ty.headingWeight, [500, 600, 700, 800] as const, base.typography.headingWeight),
      lineHeight: num(ty.lineHeight, 1.2, 2, base.typography.lineHeight),
      headingLetterSpacing: num(ty.headingLetterSpacing, -0.02, 0.1, base.typography.headingLetterSpacing),
    },
    layout: {
      containerWidth: oneOf(l.containerWidth, [1152, 1280, 1440, 1600] as const, base.layout.containerWidth),
      radius: num(l.radius, 0, 24, base.layout.radius),
      stickyHeader: typeof l.stickyHeader === "boolean" ? l.stickyHeader : base.layout.stickyHeader,
      breadcrumbs: typeof l.breadcrumbs === "boolean" ? l.breadcrumbs : base.layout.breadcrumbs,
      productCard: oneOf(l.productCard, ["minimal", "detailed"] as const, base.layout.productCard),
      productImageRatio: oneOf(l.productImageRatio, ["square", "portrait"] as const, base.layout.productImageRatio),
      gridColumns: oneOf(l.gridColumns, [3, 4, 5] as const, base.layout.gridColumns),
    },
    // Missing (theme saved before these existed) → defaults; every value is checked in lib/theme-chrome.ts
    header: incoming.header ? parseHeader(incoming.header) : base.header,
    footer: incoming.footer ? parseFooter(incoming.footer) : base.footer,
    // Product filter (dashboard → Product filter)
    filters: incoming.filters ? parseFilters(incoming.filters) : base.filters,
    // Product page (dashboard → Product page)
    productPage: incoming.productPage ? parseProductPage(incoming.productPage) : base.productPage,
    texts: { ar: texts("ar"), en: texts("en") },
  };
}

export const getSiteTheme = cache(async (): Promise<SiteTheme> => {
  const base = defaultSiteTheme();
  try {
    return mergeTheme(base, await api.getTheme());
  } catch (e) {
    unstable_rethrow(e); // let Next.js handle its own signals (e.g. "render this page per request")
    console.error("[theme] could not load the theme, using defaults", e);
    return base;
  }
});
