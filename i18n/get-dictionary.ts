/**
 * Loads the fixed interface texts for a language from i18n/dictionaries/<lang>.json,
 * then applies the text changes made in the dashboard (Theme & design → Website texts).
 *
 * - Default texts: edit ar.json and en.json (every key must exist in BOTH files).
 * - Client-specific texts: change them in the dashboard — no code change needed.
 *   A dashboard change for "nav.home" replaces dict.nav.home. Unknown keys are ignored.
 * Only text values can be replaced (never the structure), so a change can't break a page.
 */
import "server-only";
import type { Locale } from "@/types";
import { getSiteTheme } from "@/lib/site-theme";

const dictionaries = {
  ar: () => import("./dictionaries/ar.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["en"]>>;

function applyOverrides<T>(dict: T, overrides: Record<string, string>): T {
  const keys = Object.keys(overrides);
  if (!keys.length) return dict;
  const copy = structuredClone(dict) as Record<string, unknown>;
  for (const key of keys) {
    const parts = key.split(".");
    let node: Record<string, unknown> | undefined = copy;
    for (const part of parts.slice(0, -1)) {
      const next: unknown = node?.[part];
      node = next && typeof next === "object" ? (next as Record<string, unknown>) : undefined;
    }
    const last = parts[parts.length - 1];
    // Replace only existing text values
    if (node && typeof node[last] === "string") node[last] = overrides[key];
  }
  return copy as T;
}

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const [dict, theme] = await Promise.all([dictionaries[locale](), getSiteTheme()]);
  return applyOverrides(dict as Dictionary, theme.texts[locale] ?? {});
};
