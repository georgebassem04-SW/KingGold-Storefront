/**
 * ONE LINK OF THE TOP MENU (browser) — knows whether its page is the one open now.
 * When it is, the link gets aria-current="page"; how that looks (colour, line, bold, filled shape) is chosen in the
 * dashboard → Header → Menu style → "Open page's link" and drawn by app/globals.css ("ACTIVE LINK" under HEADER RULES).
 *
 * Which link counts as "open": the home link only on the homepage; any other link on its page and the pages under it
 * ("/products" stays marked on a product page). To change the rule, edit `active` below.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, home, className, children }: { href: string; /** true = the homepage link */ home?: boolean; className?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href.startsWith("/") && (home ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}
