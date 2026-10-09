/**
 * FORMATTING HELPERS
 *   t(text, locale)       -> picks the Arabic or English version of a dashboard text
 *   formatPrice(...)      -> "٤٬٧٩٥ ج.م." in Arabic, "EGP 4,795" in English
 *   formatWeight(...)     -> number with up to 2 decimals
 *   formatDate(...)       -> localized date
 *   fill(template, vals)  -> fills {placeholders} in dictionary texts, e.g. "عيار {karat}"
 *   - Show decimals in prices -> change maximumFractionDigits in formatPrice
 */
import type { Locale, LocalizedText } from "@/types";

/** Pick the right language from a dashboard text, falling back to the other language */
export const t = (text: LocalizedText | undefined, locale: Locale): string =>
  text ? text[locale] || text.ar || text.en || "" : "";

const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-EG" : "en-US");

export const formatPrice = (amount: number, currency: string, locale: Locale): string =>
  new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatWeight = (grams: number, locale: Locale): string =>
  new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 2 }).format(grams);

export const formatDate = (iso: string, locale: Locale): string =>
  new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(iso));

/** Replace {placeholders} in dictionary strings: fill("عيار {karat}", { karat: 21 }) */
export const fill = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
