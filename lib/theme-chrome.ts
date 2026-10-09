/**
 * HEADER, FOOTER & PRODUCT FILTER SETTINGS — defaults + safety checks.
 * ------------------------------------------------------------------
 * The SAME file exists in the dashboard (lib/theme-chrome.ts) — keep both identical.
 * Edited in the dashboard → "Header" and "Footer" (sidebar). Saved inside the theme (theme.header / theme.footer),
 * so they follow the same Save draft → Publish flow as colours and fonts.
 *
 *   DEFAULT_HEADER / DEFAULT_FOOTER  -> how the site looks before anyone changes anything (= the original design)
 *   parseHeader / parseFooter        -> take whatever was saved and return a complete, safe object:
 *                                       unknown or broken values fall back to the default, so the site never breaks
 *
 * To add a new option: add it to the types (types/theme.ts, both projects), give it a default here, read it in
 * parseHeader / parseFooter, add it to the dashboard's checks (lib/validation/theme.ts) and panel
 * (components/theme/HeaderPanel.tsx / FooterPanel.tsx), then use it in the storefront's Header.tsx / Footer.tsx.
 */
import type { ChromeLink, FilterSection, FooterColumn, LocalizedText, ProductButton, ProductButtonStyle, ProductPagePart, ThemeColors, ThemeDarkMode, ThemeFilters, ThemeFooter, ThemeHeader, ThemeProductPage } from "@/types";
import { DEFAULT_ICONS, ICON_THEMES, isIcon, type IconSlot } from "@/lib/icon-library";

/** Looks of the open page's link in the top menu (dashboard → Header → Menu style) */
export const ACTIVE_LINK_STYLES = ["none", "color", "underline", "bold", "pill"] as const;
/** White or near-black, whichever is easier to read on this colour (#RRGGBB). Used for the text on the filled shape */
export function readableOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#1a1a1a" : "#ffffff";
}
/**
 * Text colour on the "filled shape" of the open page's link: the chosen one, else a readable one for the shape's colour.
 * `shape` = the shape's colour when it is a real colour (#RRGGBB); "" when it is automatic (then the header's background fits).
 */
export const pillTextColor = (chosen: string, shape: string, headerBackground: string): string => chosen || (shape ? readableOn(shape) : headerBackground);
export const FOOTER_COLUMNS: FooterColumn[] = ["about", "links", "contact", "social"];
/** How many extra links the designer can add to the top menu / the footer */
/**
 * Puts the menu links in the client's order (Header → Menu links → "Arrangement").
 * `items` are in the original order (home, products, categories, pages, extra links), each with its key;
 * links named in `order` come first in that order, the rest keep their original order after them.
 */
export function orderMenu<T extends { key: string }>(items: T[], order: string[]): T[] {
  const rank = (key: string) => {
    const i = order.indexOf(key);
    return i === -1 ? order.length : i;
  };
  return items.map((item, i) => ({ item, i })).sort((a, b) => rank(a.item.key) - rank(b.item.key) || a.i - b.i).map((x) => x.item);
}
export const MAX_EXTRA_LINKS = 8;
/** How many pages can be chosen for the top menu */
export const MAX_MENU_PAGES = 20;

export const DEFAULT_HEADER: ThemeHeader = {
  layout: "logo-start",
  menuAlign: "center",
  height: "normal",
  width: "boxed",
  border: false,
  shadow: false,
  logoSize: "md",
  showName: "auto",
  hoverColor: "",
  menu: { home: true, products: true, categories: true, pages: true, pageSlugs: null, order: [], extra: [] },
  menuSize: "md",
  menuWeight: "normal",
  menuUppercase: false,
  activeStyle: "none",
  activeColor: "",
  activeTextColor: "",
  icons: {
    search: true,
    account: true,
    cart: true,
    language: true,
    size: "md",
    set: { search: DEFAULT_ICONS.search, account: DEFAULT_ICONS.account, cart: DEFAULT_ICONS.cart, menu: DEFAULT_ICONS.menu, language: DEFAULT_ICONS.language },
  },
  transparent: { enabled: false, opacity: 0, blur: false, foreground: "" },
  announcement: { enabled: false, text: { ar: "", en: "" }, href: "", background: "", foreground: "" },
};

export const DEFAULT_FOOTER: ThemeFooter = {
  layout: "columns",
  columns: ["about", "links", "contact"],
  align: "start",
  spacing: "normal",
  width: "boxed",
  borderTop: false,
  showLogo: true,
  logoSize: "md",
  showName: true,
  showTagline: true,
  headingColor: "",
  links: { home: true, products: true, contact: true, pages: true, extra: [] },
  contact: { phone: true, whatsapp: false, email: true, address: true, hours: false },
  contactDisplay: "details",
  contactDirection: "column",
  contactAlign: "start",
  contactIconStyle: "circle",
  contactIcons: { phone: DEFAULT_ICONS.phone, whatsapp: DEFAULT_ICONS.whatsapp, email: DEFAULT_ICONS.email, address: DEFAULT_ICONS.address, hours: DEFAULT_ICONS.hours },
  transparent: false,
  socialStyle: "circle",
  bottom: { show: true, text: { ar: "", en: "" }, poweredBy: true, align: "center", background: "" },
  backToTop: false,
};

/* ---------- small checkers ---------- */
type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);
/** "" (not set) or #RRGGBB */
const color = (v: unknown, fallback: string) => (typeof v === "string" && (v === "" || /^#[0-9a-f]{6}$/i.test(v)) ? v : fallback);
const text = (v: unknown, max: number): LocalizedText => {
  const o = obj(v);
  const s = (x: unknown) => (typeof x === "string" ? x.slice(0, max) : "");
  return { ar: s(o.ar), en: s(o.en) };
};
/** Only site paths ("/products"), page anchors ("#x"), http(s), mailto: and tel: — never "javascript:" */
export const safeHref = (v: unknown): string =>
  typeof v === "string" && v.length <= 300 && ((v.startsWith("/") && !v.startsWith("//")) || v.startsWith("#") || /^(https?:\/\/|mailto:|tel:)[^\s"'<>]+$/i.test(v)) ? v : "";
/** An icon id of this slot, else the fallback */
const icon = (slot: IconSlot, v: unknown, fallback: string) => (isIcon(slot, v) ? v : fallback);
const links = (v: unknown): ChromeLink[] =>
  (Array.isArray(v) ? v : [])
    .slice(0, MAX_EXTRA_LINKS)
    .map((l) => ({ label: text(obj(l).label, 60), href: safeHref(obj(l).href) }));

export function parseHeader(input: unknown): ThemeHeader {
  const h = obj(input);
  const d = DEFAULT_HEADER;
  const menu = obj(h.menu);
  const icons = obj(h.icons);
  const a = obj(h.announcement);
  const tr = obj(h.transparent);
  // Icons: the chosen set. Themes saved by the first version only had "style" + "cartIcon" → turn them into a set
  const set = obj(icons.set);
  const old = icons.style === "outline" ? ICON_THEMES.line : ICON_THEMES.solid;
  const oldCart = icons.cartIcon === "bag" ? (icons.style === "outline" ? "bag-line" : "bag-solid") : icons.style === "outline" ? "cart-line" : "cart-solid";
  const legacy = "style" in icons || "cartIcon" in icons;
  const base = legacy ? { ...old, cart: oldCart, menu: d.icons.set.menu, language: d.icons.set.language } : d.icons.set;
  return {
    layout: oneOf(h.layout, ["logo-start", "logo-center", "stacked"] as const, d.layout),
    menuAlign: oneOf(h.menuAlign, ["start", "center", "end"] as const, d.menuAlign),
    height: oneOf(h.height, ["compact", "normal", "tall"] as const, d.height),
    width: oneOf(h.width, ["boxed", "full"] as const, d.width),
    border: bool(h.border, d.border),
    shadow: bool(h.shadow, d.shadow),
    logoSize: oneOf(h.logoSize, ["sm", "md", "lg"] as const, d.logoSize),
    showName: oneOf(h.showName, ["auto", "show", "hide"] as const, d.showName),
    hoverColor: color(h.hoverColor, d.hoverColor),
    menu: {
      home: bool(menu.home, d.menu.home),
      products: bool(menu.products, d.menu.products),
      categories: bool(menu.categories, d.menu.categories),
      pages: bool(menu.pages, d.menu.pages),
      // A list = exactly these pages; anything else = automatic
      pageSlugs: Array.isArray(menu.pageSlugs) ? [...new Set(menu.pageSlugs.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 60))].slice(0, MAX_MENU_PAGES) : null,
      order: (Array.isArray(menu.order) ? menu.order : []).filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 80).slice(0, 60),
      extra: links(menu.extra),
    },
    menuSize: oneOf(h.menuSize, ["sm", "md", "lg"] as const, d.menuSize),
    menuWeight: oneOf(h.menuWeight, ["normal", "bold"] as const, d.menuWeight),
    menuUppercase: bool(h.menuUppercase, d.menuUppercase),
    activeStyle: oneOf(h.activeStyle, ACTIVE_LINK_STYLES, d.activeStyle),
    activeColor: color(h.activeColor, d.activeColor),
    activeTextColor: color(h.activeTextColor, d.activeTextColor),
    icons: {
      search: bool(icons.search, d.icons.search),
      account: bool(icons.account, d.icons.account),
      cart: bool(icons.cart, d.icons.cart),
      language: bool(icons.language, d.icons.language),
      size: oneOf(icons.size, ["sm", "md", "lg"] as const, d.icons.size),
      set: {
        search: icon("search", set.search, base.search),
        account: icon("account", set.account, base.account),
        cart: icon("cart", set.cart, base.cart),
        menu: icon("menu", set.menu, base.menu),
        language: icon("language", set.language, base.language),
      },
    },
    transparent: {
      enabled: bool(tr.enabled, d.transparent.enabled),
      opacity: typeof tr.opacity === "number" && tr.opacity >= 0 && tr.opacity <= 90 ? Math.round(tr.opacity) : d.transparent.opacity,
      blur: bool(tr.blur, d.transparent.blur),
      foreground: color(tr.foreground, ""),
    },
    announcement: {
      enabled: bool(a.enabled, d.announcement.enabled),
      text: text(a.text, 200),
      href: safeHref(a.href),
      background: color(a.background, ""),
      foreground: color(a.foreground, ""),
    },
  };
}

export function parseFooter(input: unknown): ThemeFooter {
  const f = obj(input);
  const d = DEFAULT_FOOTER;
  const l = obj(f.links);
  const c = obj(f.contact);
  const b = obj(f.bottom);
  const ci = obj(f.contactIcons);
  // Columns: only known names, each once, in the saved order
  const columns = Array.isArray(f.columns) ? [...new Set(f.columns.filter((x): x is FooterColumn => FOOTER_COLUMNS.includes(x as FooterColumn)))] : d.columns;
  return {
    layout: oneOf(f.layout, ["columns", "centered"] as const, d.layout),
    columns,
    align: oneOf(f.align, ["start", "center"] as const, d.align),
    spacing: oneOf(f.spacing, ["compact", "normal", "spacious"] as const, d.spacing),
    width: oneOf(f.width, ["boxed", "full"] as const, d.width),
    borderTop: bool(f.borderTop, d.borderTop),
    showLogo: bool(f.showLogo, d.showLogo),
    logoSize: oneOf(f.logoSize, ["sm", "md", "lg"] as const, d.logoSize),
    showName: bool(f.showName, d.showName),
    showTagline: bool(f.showTagline, d.showTagline),
    headingColor: color(f.headingColor, d.headingColor),
    links: {
      home: bool(l.home, d.links.home),
      products: bool(l.products, d.links.products),
      contact: bool(l.contact, d.links.contact),
      pages: bool(l.pages, d.links.pages),
      extra: links(l.extra),
    },
    contact: {
      phone: bool(c.phone, d.contact.phone),
      whatsapp: bool(c.whatsapp, d.contact.whatsapp),
      email: bool(c.email, d.contact.email),
      address: bool(c.address, d.contact.address),
      hours: bool(c.hours, d.contact.hours),
    },
    contactDisplay: oneOf(f.contactDisplay, ["details", "icons", "both"] as const, d.contactDisplay),
    contactDirection: oneOf(f.contactDirection, ["column", "row"] as const, d.contactDirection),
    contactAlign: oneOf(f.contactAlign, ["start", "center", "end"] as const, d.contactAlign),
    contactIconStyle: oneOf(f.contactIconStyle, ["plain", "circle"] as const, d.contactIconStyle),
    contactIcons: {
      phone: icon("phone", ci.phone, d.contactIcons.phone),
      whatsapp: icon("whatsapp", ci.whatsapp, d.contactIcons.whatsapp),
      email: icon("email", ci.email, d.contactIcons.email),
      address: icon("address", ci.address, d.contactIcons.address),
      hours: icon("hours", ci.hours, d.contactIcons.hours),
    },
    transparent: bool(f.transparent, d.transparent),
    socialStyle: oneOf(f.socialStyle, ["plain", "circle"] as const, d.socialStyle),
    bottom: {
      show: bool(b.show, d.bottom.show),
      text: text(b.text, 200),
      poweredBy: bool(b.poweredBy, d.bottom.poweredBy),
      align: oneOf(b.align, ["start", "center", "between"] as const, d.bottom.align),
      background: color(b.background, ""),
    },
    backToTop: bool(f.backToTop, d.backToTop),
  };
}

/* ===================== PRODUCT FILTER ===================== */
/**
 * Dashboard → "Product filter". Saved in theme.filters, shown by storefront/components/catalog/FilterPanel.tsx
 *   FILTER_SECTIONS  -> every section that exists (to add one: add it here, in types/theme.ts and in FilterPanel.tsx)
 *   DEFAULT_FILTERS  -> all sections, in the original order (+ "Special offers" after the categories)
 */
export const FILTER_SECTIONS: FilterSection[] = ["category", "offers", "price", "karat", "metal", "weight", "collection", "stock"];
/** How many categories can be picked for the filter */
export const MAX_FILTER_CATEGORIES = 60;

export const DEFAULT_FILTERS: ThemeFilters = { sections: [...FILTER_SECTIONS], categoryIds: [] };

export function parseFilters(input: unknown): ThemeFilters {
  const f = obj(input);
  // Known sections only, each once. Not saved yet → the default list
  const sections = Array.isArray(f.sections) ? [...new Set(f.sections.filter((x): x is FilterSection => FILTER_SECTIONS.includes(x as FilterSection)))] : DEFAULT_FILTERS.sections;
  const ids = (Array.isArray(f.categoryIds) ? f.categoryIds : []).filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 100);
  return { sections: [...sections], categoryIds: [...new Set(ids)].slice(0, MAX_FILTER_CATEGORIES) };
}

/* ===================== PRODUCT PAGE ===================== */
/**
 * Dashboard → "Product page". Saved in theme.productPage, used by storefront/app/[locale]/products/[slug]/page.tsx
 *   PRODUCT_PAGE_PARTS    -> every part that has a switch, in the order of the page
 *                            (to add one: add it here, in types/theme.ts, in the dictionaries and in the product page)
 *   DEFAULT_PRODUCT_PAGE  -> everything shown, photos first, "Add to cart" as the main button
 */
export const PRODUCT_PAGE_PARTS: ProductPagePart[] = ["newBadge", "sku", "priceNote", "stock", "quantity", "buyNow", "whatsapp", "priceBreakdown", "description", "specifications", "related"];

/** The three buttons, in their original order */
export const PRODUCT_BUTTONS: ProductButton[] = ["cart", "buy", "whatsapp"];

const button = (style: ProductButtonStyle["style"]): ProductButtonStyle => ({ style, color: "", textColor: "", icon: true });

export const DEFAULT_PRODUCT_PAGE: ThemeProductPage = {
  show: Object.fromEntries(PRODUCT_PAGE_PARTS.map((p) => [p, true])) as Record<ProductPagePart, boolean>,
  imageSide: "start",
  relatedCount: 4,
  align: "start",
  buttons: { cart: button("filled"), buy: button("outline"), whatsapp: button("outline") },
  buttonOrder: [...PRODUCT_BUTTONS],
  buttonsLayout: "stack",
  buttonSize: "md",
  buttonShape: "theme",
};

const hexColor = (v: unknown): string => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : "");
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

export function parseProductPage(input: unknown): ThemeProductPage {
  const p = obj(input);
  const show = obj(p.show);
  const saved = obj(p.buttons);
  // Themes saved before each button had its own look only knew "which one is filled" (mainButton)
  const legacyBuyMain = p.mainButton === "buy";
  const fallback: Record<ProductButton, ProductButtonStyle["style"]> = { cart: legacyBuyMain ? "outline" : "filled", buy: legacyBuyMain ? "filled" : "outline", whatsapp: "outline" };
  const order = (Array.isArray(p.buttonOrder) ? p.buttonOrder : []).filter((x): x is ProductButton => PRODUCT_BUTTONS.includes(x as ProductButton));
  return {
    // Anything not saved as "false" is shown, so a part added later appears by itself
    show: Object.fromEntries(PRODUCT_PAGE_PARTS.map((k) => [k, show[k] !== false])) as Record<ProductPagePart, boolean>,
    imageSide: p.imageSide === "end" ? "end" : "start",
    relatedCount: p.relatedCount === 8 ? 8 : 4,
    align: pick(p.align, ["start", "center", "end"] as const, "start"),
    buttons: Object.fromEntries(
      PRODUCT_BUTTONS.map((k) => {
        const b = obj(saved[k]);
        return [k, { style: pick(b.style, ["filled", "outline"] as const, fallback[k]), color: hexColor(b.color), textColor: hexColor(b.textColor), icon: b.icon !== false }];
      }),
    ) as Record<ProductButton, ProductButtonStyle>,
    // Each button once; one that is missing goes to the end
    buttonOrder: [...new Set([...order, ...PRODUCT_BUTTONS])],
    buttonsLayout: p.buttonsLayout === "row" ? "row" : "stack",
    buttonSize: pick(p.buttonSize, ["sm", "md", "lg"] as const, "md"),
    buttonShape: pick(p.buttonShape, ["theme", "square", "pill"] as const, "theme"),
  };
}

/** WhatsApp green, used when the WhatsApp button is filled and no colour was chosen */
export const WHATSAPP_GREEN = "#1FA855";

/**
 * Colours of one product-page button as inline CSS (used by the website and by the dashboard's preview).
 * Automatic colour = the website's main colour; the WhatsApp button stays neutral (outline) or green (filled).
 */
export function productButtonCss(key: ProductButton, b: ProductButtonStyle): { backgroundColor: string; color: string; borderColor: string } {
  const auto = b.color === "";
  if (b.style === "filled") {
    const bg = b.color || (key === "whatsapp" ? WHATSAPP_GREEN : "var(--primary)");
    const text = b.textColor || (auto && key !== "whatsapp" ? "var(--primary-foreground)" : readableOn(b.color || WHATSAPP_GREEN));
    return { backgroundColor: bg, color: text, borderColor: bg };
  }
  if (auto && key === "whatsapp") return { backgroundColor: "transparent", color: b.textColor || "inherit", borderColor: "var(--border)" };
  const c = b.color || "var(--primary)";
  return { backgroundColor: "transparent", color: b.textColor || c, borderColor: c };
}

/* ===================== DARK MODE ===================== */
/**
 * Dashboard → Theme & design → "Dark mode". Saved in theme.darkMode.
 *   suggestedDarkColors -> the starting dark colours: dark page, light text, and the store's own main colour
 *                          (change the greys here to change the suggestion)
 *   parseDarkMode       -> checks what was saved; a missing colour gets the suggested one
 * The website writes them as CSS under html[data-mode="dark"] (storefront/lib/theme.ts) and the visitor's choice
 * is kept by storefront/components/layout/ModeToggle.tsx.
 */
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** A dark brand colour (navy, deep green…) is made lighter, step by step, until it can be read on the dark page */
function readableOnDark(hex: string, page: string): string {
  let color = hex;
  for (let i = 0; i < 12 && contrast(color, page) < 4.5; i++) {
    const n = parseInt(color.slice(1), 16);
    const mix = (v: number) => Math.round(v + (255 - v) * 0.15);
    color = "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => mix(v).toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  return color;
}

export function suggestedDarkColors(light: ThemeColors): ThemeColors {
  const ok = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);
  // The store's own main colour, lightened only when it would be too dark to read
  const primary = ok(light.primary) ? readableOnDark(light.primary, "#121212") : light.primary;
  return {
    primary,
    primaryForeground: primary === light.primary || !ok(primary) ? light.primaryForeground : readableOn(primary),
    accent: ok(light.accent) ? readableOnDark(light.accent, "#121212") : light.accent,
    danger: "#F87171",
    background: "#121212",
    foreground: "#F2F2F2",
    card: "#1C1C1C",
    muted: "#242424",
    mutedForeground: "#A8A8A8",
    border: "#333333",
    secondary: "#1F1F1F",
    secondaryForeground: "#F2F2F2",
    headerBackground: "#0A0A0A",
    headerForeground: "#FFFFFF",
    footerBackground: "#0A0A0A",
    footerForeground: "#FFFFFF",
  };
}

export function parseDarkMode(input: unknown, light: ThemeColors): ThemeDarkMode {
  const d = obj(input);
  const saved = obj(d.colors);
  const colors = suggestedDarkColors(light);
  for (const k of Object.keys(colors) as (keyof ThemeColors)[]) {
    const v = hexColor(saved[k]);
    if (v) colors[k] = v;
  }
  return { enabled: d.enabled === true, default: d.default === "dark" ? "dark" : "light", colors };
}
