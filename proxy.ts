/**
 * LANGUAGE REDIRECT (runs before every page)
 * If the URL has no language (/products), it redirects to /ar/products or /en/products.
 * Order of choice: 1) language the visitor chose before (cookie)  2) browser language  3) client's default.
 * (In Next.js 16 this file is called proxy.ts; older versions called it middleware.ts.)
 */
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n/config";

/**
 * Runs before every page request (Next.js 16 renamed "middleware" to "proxy").
 * If the URL has no language prefix, redirect: /products -> /ar/products
 * Order of choice: saved cookie -> browser language -> client's default language.
 */
function pickLocale(request: NextRequest): string {
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && (locales as string[]).includes(cookie)) return cookie;

  const header = request.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase());
  const match = preferred.find((lang) => (locales as string[]).includes(lang));
  return match ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request)}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes and static files (anything with a dot, e.g. logo.svg)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
