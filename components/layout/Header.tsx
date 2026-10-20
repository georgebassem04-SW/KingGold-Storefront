/**
 * HEADER — the bar at the top of every page.
 * ------------------------------------------------------------------
 * Almost everything here is chosen in the dashboard → "Header" (saved in the theme as `header`):
 *   arrangement (logo at the start / in the middle / menu on a second row), menu position, height, width,
 *   line / shadow, logo size, show the store name, hover colour, which links and icons show, icon style,
 *   the icons' drawings (icon library: lib/icon-library.ts), the see-through header over the first picture,
 *   and the announcement strip above it.
 * Defaults (= the original design) and safety checks: lib/theme-chrome.ts
 *
 * Phones/tablets always use: [☰ menu] [logo]                    [search · cart]   (menu: MobileMenu.tsx)
 *
 * Where to edit the things that are NOT in the dashboard:
 *   - Exact sizes behind "small / medium / large" -> the HEIGHT, LOGO_*, MENU_*, ICON maps below
 *   - Link TEXT (AR/EN)                           -> i18n/dictionaries/ar.json + en.json → "nav" (or dashboard → Theme → Texts)
 *   - Page links (About, Contact…)                -> dashboard → Site pages → "Show in: top menu"
 * Other dashboard places: logo → Theme & design → Brand · colours → Colours · stays on top → Header (layout.stickyHeader)
 *
 * "start"/"end" are used instead of left/right so the header flips automatically in Arabic.
 */
import Link from "next/link";
import { ChevronDown, Phone } from "lucide-react";
import type { Category, Locale } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localePath } from "@/i18n/config";
import { t } from "@/lib/format";
import { CartButton } from "./CartButton";
import { HeaderSearch } from "./HeaderSearch";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ModeToggle } from "./ModeToggle";
import { MobileMenu } from "./MobileMenu";
import { getSiteTheme } from "@/lib/site-theme";
import { getStoreContact } from "@/lib/store-contact";
import { getMenuPages, pagePath } from "@/lib/site-pages";
import { cn } from "@/lib/utils";
import { iconFor } from "@/lib/icon-library";
import { HeaderScroll } from "./HeaderScroll";
import { NavLink } from "./NavLink";
import { pillTextColor, orderMenu } from "@/lib/theme-chrome";
import type { HeaderPart, HeaderRow, HeaderZone } from "@/types";

/* ----- what "small / medium / large" mean (Tailwind classes) ----- */
const HEIGHT = { compact: "h-14 lg:h-16", normal: "h-16 lg:h-20", tall: "h-20 lg:h-24" } as const;
/** The same heights in px [phones, desktop] — used to slide the first picture under a see-through header */
const HEIGHT_PX = { compact: [56, 64], normal: [64, 80], tall: [80, 96] } as const;
const SECOND_ROW_PX = 49; // the "stacked" menu row (h-12 + its line)
const LOGO_SQUARE = { sm: "size-7 lg:size-8", md: "size-9 lg:size-10", lg: "size-11 lg:size-14" } as const;
const LOGO_WIDE = { sm: "h-8 max-w-[120px] lg:h-9", md: "h-10 max-w-[150px] lg:h-12 lg:max-w-[180px]", lg: "h-12 max-w-[180px] lg:h-16 lg:max-w-[240px]" } as const;
const NAME_SIZE = { sm: "text-base sm:text-lg lg:text-xl", md: "text-lg sm:text-xl lg:text-2xl", lg: "text-xl sm:text-2xl lg:text-3xl" } as const;
const MENU_SIZE = { sm: "text-sm", md: "text-base", lg: "text-lg" } as const;
const MENU_GAP = { sm: "gap-6 xl:gap-8", md: "gap-8 xl:gap-10", lg: "gap-8 xl:gap-12" } as const;
const ICON = { sm: "size-4", md: "size-5", lg: "size-6" } as const;
const JUSTIFY = { start: "justify-start", center: "justify-center", end: "justify-end" } as const;
/** Drop-down lists (Header → Menu links → "Drop-down look"): text size and space around each line */
const DD_TEXT = { sm: "text-sm", md: "text-base", lg: "text-lg" } as const;
const DD_ITEM_PAD = { compact: "px-4 py-1.5", normal: "px-4 py-2", roomy: "px-5 py-2.5" } as const;
const DD_LIST_PAD = { compact: "py-1", normal: "py-2", roomy: "py-4" } as const;
/* ----- FREE POSITIONS (dashboard → Header → Positions) ----- */
const TOP_HEIGHT = { compact: "h-9", normal: "h-11" } as const;
const TOP_PX = { compact: 36, normal: 44 } as const;
const BOTTOM_HEIGHT = { compact: "h-10", normal: "h-12" } as const;
const BOTTOM_PX = { compact: 40, normal: 48 } as const;
/** Where the parts sit inside each area of a row */
const ZONE_CLASS = { start: "justify-start", center: "justify-center", end: "justify-end" } as const;

export async function Header({ locale, dict, categories }: { locale: Locale; dict: Dictionary; categories: Category[] }) {
  // Site paths get the language in front ("/products" → "/ar/products"); "#…", "https://…", "tel:…" stay as they are
  const p = (path: string) => (path.startsWith("#") ? path : localePath(locale, path));
  const [{ brand, header: h, darkMode }, menuPages, { contact }] = await Promise.all([getSiteTheme(), getMenuPages(), getStoreContact()]);
  const storeName = t(brand.name, locale);

  // Pages in the menu: exactly the ones picked in the dashboard (Header → Menu links), in that order;
  // nothing picked = automatic (the pages set to "Top menu" in Site pages). A page taken off the website is skipped.
  const chosenPages = h.menu.pageSlugs
    ? h.menu.pageSlugs.map((slug) => menuPages.find((m) => m.slug === slug)).filter((m): m is (typeof menuPages)[number] => !!m)
    : menuPages.filter((m) => m.menu === "header");

  // ===== MENU LINKS ===== which ones show: dashboard → Header → Menu links
  // `key` names each link so the client's arrangement (Header → Menu links → "Arrangement") can be applied.
  // `children` = a drop-down under the link (Header → Menu links → "Drop-down lists")
  type MenuLink = { key: string; href: string; label: string; children?: { href: string; label: string }[] };
  const pageLinks = h.menu.pages ? chosenPages.map((m) => ({ key: `page:${m.slug}`, href: p(pagePath(m.slug)), label: t(m.title, locale) })) : [];
  const pagesGroupLabel = t(h.menu.pagesDropdown.label, locale);
  const groupPages = h.menu.pagesDropdown.enabled && pagesGroupLabel && pageLinks.length > 0;
  const topCategories = categories.filter((c) => !c.parentId).map((c) => ({ id: c.id, href: p(`/categories/${c.slug}`), label: t(c.name, locale) }));
  // The categories in the drop-down: the ones picked in Header → Menu links (in that order), or all main ones
  const ddIds = h.menu.categoriesDropdownIds;
  const ddCategories = (ddIds.length ? ddIds.map((id) => topCategories.find((c) => c.id === id)).filter((c): c is (typeof topCategories)[number] => !!c) : topCategories).map(({ href, label }) => ({ href, label }));
  const shopAll = h.menu.shopAll.show ? [{ href: p("/products"), label: t(h.menu.shopAll.label, locale) || dict.nav.shopAll }] : [];
  const links: MenuLink[] = orderMenu<MenuLink>(
    [
      ...(h.menu.home ? [{ key: "home", href: p("/"), label: dict.nav.home }] : []),
      ...(h.menu.products ? [{ key: "products", href: p("/products"), label: dict.nav.products }] : []),
      ...(h.menu.categories
        ? [
            {
              key: "categories",
              href: p("/categories"),
              label: t(h.menu.categoriesLabel, locale) || dict.nav.categories,
              // Drop-down: every main category + "All products"
              children: h.menu.categoriesDropdown ? [...ddCategories, ...shopAll] : undefined,
            },
          ]
        : []),
      // The chosen pages: each on its own, or together under one drop-down (it takes the place of the first page)
      ...(groupPages ? [{ key: pageLinks[0].key, href: pageLinks[0].href, label: pagesGroupLabel, children: pageLinks.map(({ href, label }) => ({ href, label })) }] : pageLinks),
      ...h.menu.extra.map((l, i) => ({ key: `link:${i}`, href: l.href ? p(l.href) : "", label: t(l.label, locale) })).filter((l) => l.href && l.label),
    ],
    h.menu.order,
  );

  const dd = h.dropdown;
  const wide = brand.logoShape === "wide";
  const nameHidden = h.showName === "hide" || (h.showName === "auto" && wide);
  const icon = ICON[h.icons.size];
  const container = cn("mx-auto px-3 sm:px-6", h.width === "full" ? "lg:px-8" : "max-w-7xl");
  const line = "1px solid color-mix(in srgb, var(--header-fg) 18%, transparent)";

  /* ----- the three parts ----- */
  const logo = (
    <Link href={p("/")} className="flex min-w-0 items-center gap-2">
      {/* Plain <img>: the logo can come from the dashboard's media library (any address) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={brand.logo} alt="" className={cn("shrink-0 object-contain", wide ? `w-auto ${LOGO_WIDE[h.logoSize]}` : LOGO_SQUARE[h.logoSize])} />
      <span className={nameHidden ? "sr-only" : cn("truncate font-bold", NAME_SIZE[h.logoSize])}>{storeName}</span>
    </Link>
  );

  const menu = (
    <ul className={cn("flex items-center", MENU_GAP[h.menuSize], MENU_SIZE[h.menuSize], h.menuWeight === "bold" && "font-semibold", h.menuUppercase && "uppercase tracking-wide")}>
      {links.map((l) =>
        l.children?.length ? (
          // DROP-DOWN: opens when the mouse is over it or it gets keyboard focus (pure CSS, no script)
          <li key={l.key} className="group/dd relative">
            <button type="button" className="nav-link flex items-center gap-1 whitespace-nowrap" aria-haspopup="true">
              {l.label}
              <ChevronDown className="size-3.5 transition-transform group-hover/dd:rotate-180" />
            </button>
            {/* Look of the list: dashboard → Header → Menu links → "Drop-down look" */}
            <div className="invisible absolute start-0 top-full z-50 pt-3 opacity-0 transition-opacity group-focus-within/dd:visible group-focus-within/dd:opacity-100 group-hover/dd:visible group-hover/dd:opacity-100">
              <ul
                className={cn("min-w-60 rounded-[var(--radius)] font-normal normal-case tracking-normal", DD_LIST_PAD[dd.spacing], dd.border && "border", dd.shadow && "shadow-lg")}
                style={{ background: dd.background || "var(--background)", color: dd.foreground || "var(--header-fg)", borderColor: "color-mix(in srgb, currentColor 15%, transparent)" }}
              >
                {l.children.map((c) => (
                  <li key={c.href + c.label}>
                    <Link href={c.href} className={cn("dd-link block", DD_TEXT[dd.textSize], DD_ITEM_PAD[dd.spacing])}>
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ) : (
          <li key={l.href + l.label}>
            {/* "nav-link" → hover colour from the dashboard (app/globals.css) */}
            {/* NavLink marks the page that is open now (look: dashboard → Header → "Open page's link") */}
            <NavLink href={l.href} home={l.href === p("/")} className="nav-link whitespace-nowrap">
              {l.label}
            </NavLink>
          </li>
        ),
      )}
    </ul>
  );

  // Icons: each drawing is chosen from the icon library (lib/icon-library.ts) in the dashboard → Header → Icons
  const AccountIcon = iconFor("account", h.icons.set.account)!;
  // "Show as words" (Header → Icons): Search · Log in · Cart (2) on computers; phones keep the icons
  const asText = h.icons.display === "text";
  // Each part on its own, so it can also be placed freely (Positions)
  // Search bar look and words: dashboard → Header → Search bar ("" words = the dictionary's defaults)
  const { placeholder: searchWords, buttonText: searchButton, ...searchStyle } = h.search;
  const searchPart = (
    <HeaderSearch
      locale={locale}
      label={dict.catalog.search}
      placeholder={t(searchWords, locale) || dict.catalog.searchPlaceholder}
      iconClass={icon}
      iconId={h.icons.set.search}
      asText={asText}
      look={{ ...searchStyle, buttonText: t(searchButton, locale) }}
    />
  );
  const languagePart = (
    <span className="hidden items-center gap-1 lg:inline-flex">
      <LanguageSwitcher locale={locale} label={dict.nav.switchLanguage} iconId={h.icons.set.language} iconClass={icon} />
      {/* Light / dark button: only when dark mode is on in the dashboard → Theme & design → Dark mode */}
      {darkMode.enabled && <ModeToggle labels={{ dark: dict.nav.darkMode, light: dict.nav.lightMode }} fallback={darkMode.default} iconClass={icon} />}
    </span>
  );
  const accountPart = (
    <Link href={p("/account")} aria-label={dict.nav.account} className={cn("nav-link hidden h-9 items-center justify-center sm:flex", !asText && "w-9")}>
      <AccountIcon className={cn(icon, asText && "lg:hidden")} />
      {asText && <span className="hidden whitespace-nowrap lg:inline">{dict.nav.login}</span>}
    </Link>
  );
  const cartPart = (
    <span className={cn("flex h-9 items-center justify-center", !asText && "w-9")}>
      <CartButton href={p("/cart")} label={dict.nav.cart} iconId={h.icons.set.cart} iconClass={icon} asText={asText} />
    </span>
  );
  const icons = (
    <div className={cn("flex shrink-0 items-center gap-1 sm:gap-3", asText && "lg:gap-5 lg:text-sm")}>
      {h.icons.search && searchPart}
      {h.icons.language && languagePart}
      {/* Without the language button the light / dark button still shows */}
      {!h.icons.language && darkMode.enabled && <ModeToggle labels={{ dark: dict.nav.darkMode, light: dict.nav.lightMode }} fallback={darkMode.default} iconClass={icon} />}
      {h.icons.account && accountPart}
      {h.icons.cart && cartPart}
    </div>
  );

  const mobileMenu = (
    <MobileMenu
      locale={locale}
      storeName={storeName}
      // Phones: drop-down links are listed one by one (the categories have their own list in the menu)
      links={links.flatMap((l) => (l.key === "categories" || !l.children?.length ? [{ href: l.href, label: l.label }] : l.children))}
      categories={categories.filter((c) => !c.parentId).map((c) => ({ href: p(`/categories/${c.slug}`), label: t(c.name, locale) }))}
      labels={{
        menu: dict.nav.menu,
        close: dict.nav.close,
        categories: dict.nav.categories,
        search: dict.catalog.search,
        searchPlaceholder: dict.catalog.searchPlaceholder,
        myAccount: dict.nav.myAccount,
        orders: dict.nav.orders,
        login: dict.nav.login,
        register: dict.nav.register,
        switchLanguage: dict.nav.switchLanguage,
        language: dict.nav.language,
      }}
      phone={contact.phone}
      whatsapp={contact.whatsapp}
      menuIcon={h.icons.set.menu}
    />
  );

  const a = h.announcement;
  const b = h.builder;
  const announcementText = t(a.text, locale);
  // With free positions the strip's words are a part like the others (placed in Positions); otherwise the classic strip
  const announcement = !b.enabled && a.enabled && announcementText ? announcementText : "";
  const textContent = announcementText ? (
    a.href ? (
      <Link href={a.href.startsWith("tel:") || a.href.startsWith("mailto:") ? a.href : p(a.href)} className="inline-flex items-center gap-2 whitespace-nowrap hover:underline">
        {a.phoneIcon && <Phone className="size-3.5" />}
        <span dir="auto">{announcementText}</span>
      </Link>
    ) : (
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        {a.phoneIcon && <Phone className="size-3.5" />}
        <span dir="auto">{announcementText}</span>
      </span>
    )
  ) : null;

  /* ----- FREE POSITIONS: what each part draws, and which rows are used ----- */
  const partNode: Record<HeaderPart, React.ReactNode> = {
    logo,
    menu,
    search: h.icons.search ? searchPart : null,
    language: h.icons.language ? languagePart : null,
    account: h.icons.account ? accountPart : null,
    cart: h.icons.cart ? cartPart : null,
    text: textContent ? <span className="text-sm">{textContent}</span> : null,
  };
  const placed = (row: HeaderRow, zone: HeaderZone) => b.items.filter((i) => i.show && i.row === row && i.zone === zone && partNode[i.part]);
  const rowUsed = (row: HeaderRow) => b.items.some((i) => i.show && i.row === row && partNode[i.part]);
  const rowLine = b.rowLines ? line : undefined;
  const builtRow = (row: HeaderRow, heightClass: string, extra?: React.CSSProperties) =>
    rowUsed(row) ? (
      <div key={row} className="hidden lg:block" style={extra}>
        <div className={cn(container, heightClass, "grid grid-cols-[1fr_auto_1fr] items-center gap-6")}>
          {(["start", "center", "end"] as const).map((zone) => (
            <div key={zone} className={cn("flex min-w-0 items-center gap-5", ZONE_CLASS[zone], asText && "text-sm")}>
              {placed(row, zone).map((i) => (
                <div key={i.part} className="flex items-center">
                  {partNode[i.part]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ) : null;

  // See-through header over the first big picture (dashboard → Header → Colours). The CSS is in app/globals.css
  const tr = h.transparent;
  const [hPhone, hDesktop] = HEIGHT_PX[h.height];
  const desktopH = b.enabled
    ? (rowUsed("main") ? hDesktop : 0) + (rowUsed("top") ? TOP_PX[b.topHeight] : 0) + (rowUsed("bottom") ? BOTTOM_PX[b.bottomHeight] : 0)
    : hDesktop + (h.layout === "stacked" ? SECOND_ROW_PX : 0);
  const headerHeightCss = `:root{--header-h:${hPhone}px}@media (min-width:1024px){:root{--header-h:${desktopH}px}}`;


  return (
    <>
      <span id="top" />
      {/* ===== ANNOUNCEMENT STRIP ===== (dashboard → Header → Announcement). Empty colours = the site's main colour */}
      {announcement && (
        <div className="text-sm font-medium" style={{ background: a.background || "var(--primary)", color: a.foreground || "var(--primary-foreground)" }}>
          {/* Words at the start / centre / end of the strip, with an optional phone icon (Header → Announcement) */}
          <div className={cn(container, "flex py-2", JUSTIFY[a.align])}>
            {a.href ? (
              <Link href={a.href.startsWith("tel:") || a.href.startsWith("mailto:") ? a.href : p(a.href)} className="inline-flex items-center gap-2 hover:underline">
                {a.phoneIcon && <Phone className="size-3.5" />}
                <span dir="auto">{announcement}</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2">
                {a.phoneIcon && <Phone className="size-3.5" />}
                <span dir="auto">{announcement}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {tr.enabled && (
        <>
          {/* Header height for the CSS that slides the picture under it + "has the page been scrolled?" */}
          <style dangerouslySetInnerHTML={{ __html: headerHeightCss }} />
          <HeaderScroll />
        </>
      )}
      <header
        className={cn("site-header sticky top-0 z-40 bg-header text-header-foreground", h.shadow && "shadow-md")}
        data-overlay={tr.enabled ? "true" : undefined}
        data-blur={tr.enabled && tr.blur ? "true" : undefined}
        data-active={h.activeStyle === "none" ? undefined : h.activeStyle}
        style={{
          ["--header-active" as string]: h.activeColor || undefined,
          // Words on the filled shape: the chosen colour, else white / dark picked to be readable on it
          ["--header-active-text" as string]: h.activeStyle === "pill" ? pillTextColor(h.activeTextColor, h.activeColor || h.hoverColor, "var(--header-bg)") : undefined,
          borderBottom: h.border ? line : undefined,
          ["--header-hover" as string]: h.hoverColor || undefined,
          // Colours while see-through: part of the header colour (opacity) + its own text colour
          ["--header-overlay-bg" as string]: tr.enabled ? `color-mix(in srgb, var(--header-bg) ${tr.opacity}%, transparent)` : undefined,
          ["--header-overlay-fg" as string]: tr.enabled && tr.foreground ? tr.foreground : undefined,
        }}
      >
        {/* ===== FREE POSITIONS (computers) ===== top strip · main row · bottom row, each with start / centre / end areas */}
        {b.enabled && (
          <>
            {builtRow("top", TOP_HEIGHT[b.topHeight], { background: a.background || undefined, color: a.foreground || undefined, borderBottom: rowLine })}
            {builtRow("main", HEIGHT[h.height])}
            {builtRow("bottom", BOTTOM_HEIGHT[b.bottomHeight], { borderTop: rowLine })}
            {/* Phones: the simple header */}
            <div className={cn(container, "flex h-16 items-center gap-2 lg:hidden")}>
              <div className="flex min-w-0 flex-1 items-center gap-1">
                {mobileMenu}
                {logo}
              </div>
              {icons}
            </div>
          </>
        )}

        {/* ===== MAIN ROW ===== (classic arrangements) */}
        {!b.enabled && (
        <div className={cn(container, HEIGHT[h.height], "flex items-center gap-2", h.layout === "logo-center" && "lg:grid lg:grid-cols-[1fr_auto_1fr]")}>
          {/* Menu button (phones) + logo */}
          <div className={cn("flex min-w-0 flex-1 items-center gap-1 lg:flex-none", h.layout === "logo-center" && "lg:order-2 lg:justify-center")}>
            {mobileMenu}
            {logo}
          </div>

          {/* Desktop menu — on the same row, except in the "stacked" arrangement */}
          {h.layout !== "stacked" ? (
            <nav className={cn("hidden min-w-0 lg:flex", h.layout === "logo-center" ? "lg:order-1 lg:justify-start" : cn("flex-1 px-6", JUSTIFY[h.menuAlign]))}>{menu}</nav>
          ) : (
            <span className="hidden flex-1 lg:block" />
          )}

          <div className={cn(h.layout === "logo-center" && "lg:order-3 lg:justify-self-end")}>{icons}</div>
        </div>
        )}

        {/* ===== SECOND ROW ===== only in the "stacked" arrangement */}
        {!b.enabled && h.layout === "stacked" && (
          <nav className="hidden lg:block" style={{ borderTop: line }}>
            <div className={cn(container, "flex h-12 items-center", JUSTIFY[h.menuAlign])}>{menu}</div>
          </nav>
        )}
      </header>
    </>
  );
}
