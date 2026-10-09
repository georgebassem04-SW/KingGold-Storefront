/**
 * Props shared by every homepage block component (see SectionRenderer.tsx).
 */
import type { GoldPrice, HomeSection, Locale } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Props every section component receives */
export interface SectionProps<S extends HomeSection = HomeSection> {
  section: S;
  locale: Locale;
  dict: Dictionary;
  goldPrices: GoldPrice[];
}
