/**
 * WEBSITE THEME — everything about how the storefront looks, edited in the dashboard (المظهر والتصميم).
 * ------------------------------------------------------------------
 * The SAME file exists in storefront/types/theme.ts — keep both identical.
 *
 * Flow: the designer edits a DRAFT in the dashboard → presses "Publish" → the storefront reads the
 * PUBLISHED theme from the API and applies it (colours, fonts, sizes, logo, texts…).
 * Anything left empty falls back to the storefront's own defaults (config/clients/<client>.ts, i18n files).
 */
import type { LocalizedText } from "./common";

/** Font keys. Each key must be declared in storefront/lib/fonts.ts (fonts are loaded at build time). */
export const ARABIC_FONTS = ["cairo", "tajawal", "almarai", "ibmPlexArabic", "notoKufi", "elMessiri", "readexPro", "amiri", "notoNaskh", "markazi", "lateef", "arefRuqaa", "reemKufi", "alexandria", "changa"] as const;
export const LATIN_FONTS = ["inter", "playfair", "cormorant", "montserrat", "lora", "poppins", "cinzel", "bodoniModa", "ebGaramond", "libreBaskerville", "marcellus", "dmSerifDisplay", "jost", "raleway"] as const;
export type ArabicFont = (typeof ARABIC_FONTS)[number];
export type LatinFont = (typeof LATIN_FONTS)[number];

export interface ThemeColors {
  /** Buttons, prices, links (the main brand colour) */
  primary: string;
  /** Text on top of primary buttons */
  primaryForeground: string;
  /** Soft backgrounds (gold price strip, promo boxes) */
  secondary: string;
  secondaryForeground: string;
  /** Hover highlights, small accents */
  accent: string;
  /** Page background */
  background: string;
  /** Main text */
  foreground: string;
  /** Cards, boxes on top of the page background */
  card: string;
  /** Image placeholders, light boxes */
  muted: string;
  /** Grey secondary text */
  mutedForeground: string;
  /** Lines and borders */
  border: string;
  headerBackground: string;
  headerForeground: string;
  footerBackground: string;
  footerForeground: string;
  /** Errors, "out of stock" warnings */
  danger: string;
}

/**
 * DARK MODE — dashboard → Theme & design → "Dark mode".
 * On = a sun / moon button appears in the website's top bar and visitors can switch; their choice is remembered.
 */
export interface ThemeDarkMode {
  /** Show the light / dark button on the website */
  enabled: boolean;
  /** What a visitor sees the first time (before choosing) */
  default: "light" | "dark";
  /** The website's colours while dark mode is on (same list as the normal colours) */
  colors: ThemeColors;
}

export interface ThemeTypography {
  arabicFont: ArabicFont;
  /** Arabic headings (h1–h3) */
  arabicHeadingFont: ArabicFont;
  latinFont: LatinFont;
  /** English headings (h1–h3) */
  latinHeadingFont: LatinFont;
  /** Base text size in px (all sizes on the site scale from this). 14–18 */
  baseSize: number;
  /** Heading boldness: 500 medium … 800 extra bold */
  headingWeight: 500 | 600 | 700 | 800;
  /** Space between lines of body text, e.g. 1.6 */
  lineHeight: number;
  /** Letter spacing for English headings in em, e.g. 0 or 0.02 */
  headingLetterSpacing: number;
}

export interface ThemeLayout {
  /** Max width of the page content in px */
  containerWidth: 1152 | 1280 | 1440 | 1600;
  /** Roundness of buttons, cards and images in px (0 = square) */
  radius: number;
  /** Header stays visible while scrolling */
  stickyHeader: boolean;
  /** The small page path at the top of pages ("Home / Categories / Rings"). false = hidden on the whole website */
  breadcrumbs: boolean;
  /** "detailed" = karat + weight under the product name, "minimal" = name + price only */
  productCard: "minimal" | "detailed";
  /** Shape of product images */
  productImageRatio: "square" | "portrait";
  /** Products per row on desktop */
  gridColumns: 3 | 4 | 5;
}

export interface ThemeBrand {
  name: LocalizedText;
  tagline: LocalizedText;
  /** Header logo (URL from the media library) */
  logo: string;
  /** Optional logo for dark backgrounds (footer). Empty = same as logo */
  logoOnDark: string;
  /**
   * Frame the logo was cropped for (dashboard → Theme & design → Logo → crop):
   *   "square" = icon only, the store name is written next to it
   *   "wide"   = the logo already contains the name (3:1), so the written name is hidden
   * Missing = "square"
   */
  logoShape?: "square" | "wide";
  /** Browser tab icon */
  favicon: string;
  /** Picture shown when the site is shared on WhatsApp / social media */
  shareImage: string;
}

/** A link the designer adds to the top menu or the footer */
export interface ChromeLink {
  label: LocalizedText;
  /** "/products", "/pages/about", "https://…", "tel:…", "mailto:…" */
  href: string;
}

/**
 * HEADER (top bar) — dashboard → "Header". Defaults + checks: lib/theme-chrome.ts.
 * Colours: colors.headerBackground / headerForeground · Stays on top: layout.stickyHeader · Logo: brand.logo
 */
export interface ThemeHeader {
  /**
   * Desktop arrangement:
   *   "logo-start"  = logo at the start, menu next to it, icons at the end (the classic one)
   *   "logo-center" = menu at the start, logo in the middle, icons at the end
   *   "stacked"     = logo and icons on the first row, the menu on a second row
   */
  layout: "logo-start" | "logo-center" | "stacked";
  /** Where the menu links sit (in "logo-start" and "stacked") */
  menuAlign: "start" | "center" | "end";
  height: "compact" | "normal" | "tall";
  /** "boxed" = same width as the page content, "full" = edge to edge */
  width: "boxed" | "full";
  /** Thin line / soft shadow under the header */
  border: boolean;
  shadow: boolean;
  logoSize: "sm" | "md" | "lg";
  /** Store name next to the logo: "auto" = hidden only for a wide logo (brand.logoShape) */
  showName: "auto" | "show" | "hide";
  /** Colour of a link when the mouse is over it. "" = just fade */
  hoverColor: string;
  menu: {
    home: boolean;
    products: boolean;
    categories: boolean;
    /** Show pages from Site pages in the top menu */
    pages: boolean;
    /**
     * WHICH pages, in this order (page slugs), chosen in Header → Menu links.
     * null = automatic: the pages whose "Show in" is set to "Top menu" in Site pages.
     */
    pageSlugs: string[] | null;
    /**
     * ARRANGEMENT of every link in the menu, first → last. Each entry is a key:
     * "home" · "products" · "categories" · "page:<slug>" · "link:<position in extra>".
     * A link that is not listed comes after the listed ones. Empty = the original order.
     */
    order: string[];
    /** Extra links, shown after the others */
    extra: ChromeLink[];
  };
  menuSize: "sm" | "md" | "lg";
  menuWeight: "normal" | "bold";
  /** English menu in CAPITALS */
  menuUppercase: boolean;
  /**
   * How the link of the page that is OPEN NOW looks in the top menu:
   * "none" = like the others · "color" = coloured text · "underline" = a line under it · "bold" = thicker text ·
   * "pill" = a filled rounded shape behind it
   */
  activeStyle: "none" | "color" | "underline" | "bold" | "pill";
  /** Colour used by activeStyle. "" = automatic (the hover colour if there is one, else the header text colour) */
  activeColor: string;
  /** Text colour ON the filled shape ("pill" only). "" = automatic: white or dark, whichever reads better on it */
  activeTextColor: string;
  icons: {
    search: boolean;
    account: boolean;
    cart: boolean;
    /** The "English / العربية" switch */
    language: boolean;
    size: "sm" | "md" | "lg";
    /** Which drawing each icon uses — ids from the icon library (lib/icon-library.ts). "menu" = the ☰ button on phones */
    set: { search: string; account: string; cart: string; menu: string; language: string };
  };
  /**
   * See-through header that sits ON TOP of the first big picture of a page (homepage slider, page title banner with a picture).
   * On other pages, and after scrolling down, the header goes back to its normal colour.
   */
  transparent: {
    enabled: boolean;
    /** How much of the header colour is kept over the picture: 0 = fully see-through … 90 */
    opacity: number;
    /** Soft blur of the picture behind the header ("frosted glass") */
    blur: boolean;
    /** Text / icon colour while it is see-through. "" = the normal header text colour */
    foreground: string;
  };
  /** Strip above the header ("Free delivery this week") */
  announcement: {
    enabled: boolean;
    text: LocalizedText;
    /** Optional link for the whole strip */
    href: string;
    /** "" = the site's main colour / its text colour */
    background: string;
    foreground: string;
  };
}

export type FooterColumn = "about" | "links" | "contact" | "social";

/**
 * FOOTER — dashboard → "Footer". Defaults + checks: lib/theme-chrome.ts.
 * Colours: colors.footerBackground / footerForeground · Logo: brand.logoOnDark (or brand.logo) · Tagline: brand.tagline
 * Contact details and social links come from Settings → Store details.
 */
export interface ThemeFooter {
  /** "columns" = side by side · "centered" = everything stacked in the middle */
  layout: "columns" | "centered";
  /** Which parts show, in this order: about (logo, name, tagline) · links · contact · social */
  columns: FooterColumn[];
  /** Text position inside the columns */
  align: "start" | "center";
  spacing: "compact" | "normal" | "spacious";
  width: "boxed" | "full";
  borderTop: boolean;
  showLogo: boolean;
  logoSize: "sm" | "md" | "lg";
  showName: boolean;
  showTagline: boolean;
  /** Colour of the column titles. "" = same as the footer text */
  headingColor: string;
  links: {
    home: boolean;
    products: boolean;
    contact: boolean;
    /** Pages placed in the footer from Site pages */
    pages: boolean;
    extra: ChromeLink[];
  };
  contact: { phone: boolean; whatsapp: boolean; email: boolean; address: boolean; hours: boolean };
  /** Contact part: "details" = text lines · "icons" = round icon buttons only · "both" = an icon next to each line */
  contactDisplay: "details" | "icons" | "both";
  /** Under each other, or side by side in one row */
  contactDirection: "column" | "row";
  /** Where the contact lines / icons sit inside their part */
  contactAlign: "start" | "center" | "end";
  contactIconStyle: "plain" | "circle";
  /** Which drawing each contact icon uses — ids from the icon library (lib/icon-library.ts) */
  contactIcons: { phone: string; whatsapp: string; email: string; address: string; hours: string };
  /** No footer colour: the page background shows through (the footer text colour is still used) */
  transparent: boolean;
  /** Social icons: plain, or inside a circle */
  socialStyle: "plain" | "circle";
  /** The last line */
  bottom: {
    show: boolean;
    /** Own copyright text. {year} = this year, {store} = store name. "" = the default text */
    text: LocalizedText;
    /** Show "Powered by …" */
    poweredBy: boolean;
    align: "start" | "center" | "between";
    /** "" = same as the footer */
    background: string;
  };
  /** "Back to top" button in the last line */
  backToTop: boolean;
}

/** The sections of the product filter (the side column of /products and of a category page) */
export type FilterSection = "category" | "offers" | "price" | "karat" | "metal" | "weight" | "collection" | "stock";

/**
 * PRODUCT FILTER — dashboard → "Product filter" (sidebar). Used by storefront/components/catalog/FilterPanel.tsx
 */
export interface ThemeFilters {
  /** The sections that are shown, in this order (a section left out is hidden) */
  sections: FilterSection[];
  /**
   * The categories listed in the "Category" section, in this order (category ids).
   * Empty = all main categories, in the order of the Categories page.
   */
  categoryIds: string[];
}

/** The parts of a product's page that can be switched off (dashboard → "Product page") */
export type ProductPagePart = "newBadge" | "sku" | "priceNote" | "stock" | "quantity" | "buyNow" | "whatsapp" | "priceBreakdown" | "description" | "specifications" | "related";

/** The buttons of a product's page */
export type ProductButton = "cart" | "buy" | "whatsapp";

export interface ProductButtonStyle {
  /** filled = coloured background · outline = coloured border only */
  style: "filled" | "outline";
  /** Button colour (#RRGGBB). "" = automatic: the website's main colour (WhatsApp: neutral outline / green fill) */
  color: string;
  /** Text colour (#RRGGBB). "" = automatic: readable on the button */
  textColor: string;
  /** Show the small icon before the text */
  icon: boolean;
}

/**
 * PRODUCT PAGE — dashboard → "Product page" (sidebar). Used by storefront/app/[locale]/products/[slug]/page.tsx
 */
export interface ThemeProductPage {
  /** true = shown, false = hidden */
  show: Record<ProductPagePart, boolean>;
  /** Side of the photos: start = right in Arabic / left in English */
  imageSide: "start" | "end";
  /** Text of the title, price and details: start = right in Arabic / left in English */
  align: "start" | "center" | "end";
  /** Look of each button (Add to cart, Buy now, Ask on WhatsApp) */
  buttons: Record<ProductButton, ProductButtonStyle>;
  /** Order of the buttons, first to last */
  buttonOrder: ProductButton[];
  /** stack = one under the other (quantity beside "Add to cart") · row = side by side */
  buttonsLayout: "stack" | "row";
  buttonSize: "sm" | "md" | "lg";
  /** theme = the website's normal corners · square · pill = fully round */
  buttonShape: "theme" | "square" | "pill";
  /** How many "You may also like" products */
  relatedCount: 4 | 8;
}

export interface SiteTheme {
  brand: ThemeBrand;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  /** Top bar and footer options (missing in themes saved before they existed → defaults from lib/theme-chrome.ts) */
  header: ThemeHeader;
  footer: ThemeFooter;
  /** Product filter options (missing in older themes → defaults from lib/theme-chrome.ts) */
  filters: ThemeFilters;
  /** Dark mode (missing in older themes → off, with suggested dark colours from lib/theme-chrome.ts) */
  darkMode: ThemeDarkMode;
  /** Product page options (missing in older themes → defaults from lib/theme-chrome.ts) */
  productPage: ThemeProductPage;
  /**
   * Text overrides for the website's fixed texts (menu, buttons, labels…).
   * Keys are paths in storefront/i18n/dictionaries/*.json, e.g. "nav.home" or "product.addToCart".
   * Only changed texts are stored; missing keys use the storefront's default text.
   */
  texts: { ar: Record<string, string>; en: Record<string, string> };
}

/** What the dashboard stores: the live version + the designer's work in progress */
export interface ThemeState {
  published: SiteTheme;
  publishedAt: string | null;
  /** Who published (name in both languages) */
  publishedBy: LocalizedText | null;
  /** null = no unpublished changes */
  draft: SiteTheme | null;
  draftSavedAt: string | null;
}
