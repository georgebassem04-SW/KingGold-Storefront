/**
 * ACCOUNT MENU (browser) — the side menu on every account page + the log-out button.
 * The current page is highlighted. Texts: i18n/dictionaries/*.json -> "account.nav"
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogOut, MapPin, Package, UserRound } from "lucide-react";
import type { Locale } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

export function AccountNav({ locale, labels }: { locale: Locale; labels: Dictionary["account"]["nav"] }) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const base = `/${locale}/account`;
  const items = [
    { href: base, label: labels.overview, icon: LayoutDashboard, exact: true },
    { href: `${base}/orders`, label: labels.orders, icon: Package },
    { href: `${base}/addresses`, label: labels.addresses, icon: MapPin },
    { href: `${base}/profile`, label: labels.profile, icon: UserRound },
  ];

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign(`/${locale}`);
  }

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border p-2 lg:flex-col lg:overflow-visible">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive lg:mt-2 lg:border-t lg:pt-3"
      >
        <LogOut className="size-4" />
        {labels.logout}
      </button>
    </nav>
  );
}
