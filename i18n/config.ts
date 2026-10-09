/**
 * LANGUAGE SETTINGS
 *   - locales / defaultLocale : read from the client config (config/clients/demo.ts)
 *   - rtlLocales              : languages written right-to-left
 *   - localePath("ar", "/products") -> "/ar/products"  (use it for every internal link)
 */
import type { Locale } from "@/types";
import { clientConfig } from "@/config/clients";

export const locales: Locale[] = clientConfig.locales;
export const defaultLocale: Locale = clientConfig.defaultLocale;

/** Right-to-left languages */
const rtlLocales: Locale[] = ["ar"];

export const isLocale = (value: string): value is Locale =>
  (locales as string[]).includes(value);

export const getDirection = (locale: Locale): "rtl" | "ltr" =>
  rtlLocales.includes(locale) ? "rtl" : "ltr";

/**
 * Build a link that keeps the current language: localePath("ar", "/products") -> "/ar/products"
 * Full addresses (https://…, mailto:, tel:) from the dashboard's "External link" buttons are left as they are.
 */
export const localePath = (locale: Locale, path: string): string =>
  /^[a-z][a-z0-9+.-]*:/i.test(path) ? path : `/${locale}${path === "/" ? "" : path}`;
