/**
 * MAIN LAYOUT — wraps EVERY page: sets the language + direction, loads the client's
 * colours and fonts, and places the Header above and the Footer below the page content.
 *
 * You rarely need to edit this file. To change:
 *   - Colours, fonts, sizes, logo, icon, texts -> dashboard → Theme & design
 *     (defaults when nothing is published: config/clients/demo.ts)
 *   - Header / footer       -> components/layout/Header.tsx, Footer.tsx
 * The theme is read by getSiteTheme() (lib/site-theme.ts) and turned into CSS variables (lib/theme.ts).
 */
import type { Metadata, Viewport } from "next";
import { getSiteTheme } from "@/lib/site-theme";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDirection, isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getFontClassNames } from "@/lib/fonts";
import { themeToCssVars } from "@/lib/theme";
import { modeScript } from "@/lib/site-mode";
import { t } from "@/lib/format";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers";
import { api } from "@/lib/api";

/** Pre-build every language version */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Phone browser bar colour = header colour */
export async function generateViewport(): Promise<Viewport> {
  const theme = await getSiteTheme();
  return { width: "device-width", initialScale: 1, themeColor: theme.colors.headerBackground };
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { brand } = await getSiteTheme();
  const name = t(brand.name, locale);
  return {
    title: { default: name, template: `%s | ${name}` },
    description: t(brand.tagline, locale),
    // Browser tab icon: dashboard → Header → Logo (or Theme & design → Brand). Empty = the logo
    icons: brand.favicon || brand.logo ? { icon: brand.favicon || brand.logo } : undefined,
    // Picture shown when the site is shared on WhatsApp / social media
    openGraph: brand.shareImage ? { images: [brand.shareImage], siteName: name } : { siteName: name },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Categories are needed by the header's mobile menu
  const [dict, categories, theme] = await Promise.all([getDictionary(locale), api.getCategories(), getSiteTheme()]);

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={`${getFontClassNames(theme.typography)} h-full antialiased`}
      // Switches read by app/globals.css ("4) THEME SWITCHES")
      data-product-card={theme.layout.productCard}
      data-sticky-header={String(theme.layout.stickyHeader)}
      data-breadcrumbs={String(theme.layout.breadcrumbs)}
      // Dark mode: the script below sets data-mode before the page is drawn (it may differ from the server's value)
      data-mode={theme.darkMode.enabled ? theme.darkMode.default : undefined}
      suppressHydrationWarning
    >
      <head>
        {/* Theme colours, sizes and layout values (dashboard → Theme & design) as CSS variables.
            Every value was checked in lib/site-theme.ts (colours are #RRGGBB, numbers in range). */}
        <style dangerouslySetInnerHTML={{ __html: themeToCssVars(theme) }} />
        {/* Dark mode on (dashboard → Theme & design → Dark mode): apply the visitor's saved choice straight away */}
        {theme.darkMode.enabled && <script dangerouslySetInnerHTML={{ __html: modeScript(theme.darkMode.default) }} />}
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header locale={locale} dict={dict} categories={categories} />
          <main className="flex-grow">{children}</main>
          <Footer locale={locale} dict={dict} />
        </Providers>
      </body>
    </html>
  );
}
