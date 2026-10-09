/**
 * SITE PAGES HELPERS
 *   pagePath("about")  -> "/about"        (pages with their own route)
 *   pagePath("returns") -> "/pages/returns" (any other page from the dashboard)
 *   getMenuPages()      -> pages the dashboard placed in the top menu / footer (asked once per page load)
 * The dashboard uses the same pagePath rule to show each page's link (dashboard: lib/pages/paths.ts).
 */
import "server-only";
import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import type { MenuPage } from "@/types";
import { api } from "@/lib/api";

/** Pages that have their own address (app/[locale]/<slug>/page.tsx) */
export const OWN_ROUTE_PAGES = ["about", "contact", "faq", "terms"];

/**
 * SHOP PAGE TOPS — two special pages of the dashboard (Site pages) that are not pages by themselves:
 * their blocks (a hero, a banner, text…) are drawn at the TOP of a shop page.
 *   "shop-products"   -> top of /products (All products)
 *   "shop-categories" -> top of /categories
 * Same list in the dashboard: lib/pages/paths.ts → SHOP_PAGES.
 */
export const SHOP_PAGES: Record<string, string> = { "shop-products": "/products", "shop-categories": "/categories" };

export const pagePath = (slug: string) => SHOP_PAGES[slug] ?? (OWN_ROUTE_PAGES.includes(slug) ? `/${slug}` : `/pages/${slug}`);

export const getMenuPages = cache(async (): Promise<MenuPage[]> => {
  try {
    return [...(await api.getMenuPages())].sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    unstable_rethrow(error);
    console.error("Could not load menu pages", error);
    return []; // the menus still show their fixed links
  }
});
