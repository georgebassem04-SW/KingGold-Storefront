/**
 * LANGUAGE SWITCH — the "English / العربية" link in the header.
 * Stays on the same page and only swaps the language: /ar/products <-> /en/products.
 * The label text comes from the dictionaries -> "nav.switchLanguage".
 * The choice is saved in a cookie (NEXT_LOCALE) so the next visit opens in the same language.
 */
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/types";
import { iconFor } from "@/lib/icon-library";

/** `iconId`: "text" shows the other language's name; any other id from the icon library shows that icon (dashboard → Header → Icons) */
export function LanguageSwitcher({ locale, label, iconId = "text", iconClass = "size-5" }: { locale: Locale; label: string; iconId?: string; iconClass?: string }) {
  const Icon = iconFor("language", iconId);
  const pathname = usePathname();
  const target: Locale = locale === "ar" ? "en" : "ar";
  // Replace the first part of the URL (/ar or /en) with the other language
  const href = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${target}`);

  return (
    <Link
      href={href}
      onClick={() => {
        // Remember the choice for one year
        document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=31536000`;
      }}
      className={Icon ? "nav-link flex size-9 items-center justify-center" : "nav-link text-sm"}
      hrefLang={target}
      aria-label={Icon ? label : undefined}
      title={Icon ? label : undefined}
    >
      {Icon ? <Icon className={iconClass} /> : label}
    </Link>
  );
}
