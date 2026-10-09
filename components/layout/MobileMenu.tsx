/**
 * MOBILE MENU — the ☰ button on phones and tablets opens this panel from the side.
 * ------------------------------------------------------------------
 * Contains: search, main links, all categories, account links, language switch, phone/WhatsApp.
 * Tapping a link closes the menu. Hidden on large screens (the normal header menu shows there).
 *
 * Where to edit:
 *   - Links                 -> `links` passed from Header.tsx
 *   - Categories            -> come from the dashboard (mock: mock-data/categories.json)
 *   - Texts (AR/EN)         -> i18n/dictionaries/*.json -> "nav"
 */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle, Phone, Search, UserRound } from "lucide-react";
import { DEFAULT_ICONS, iconFor } from "@/lib/icon-library";
import type { Locale } from "@/types";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface Props {
  locale: Locale;
  storeName: string;
  links: { href: string; label: string }[];
  categories: { href: string; label: string }[];
  labels: {
    menu: string;
    close: string;
    categories: string;
    search: string;
    searchPlaceholder: string;
    myAccount: string;
    orders: string;
    login: string;
    register: string;
    switchLanguage: string;
    language: string;
  };
  phone: string;
  whatsapp?: string;
  /** The ☰ button's drawing — id from the icon library (dashboard → Header → Icons) */
  menuIcon?: string;
}

export function MobileMenu({ locale, storeName, links, categories, labels, phone, whatsapp, menuIcon = DEFAULT_ICONS.menu }: Props) {
  const MenuIcon = iconFor("menu", menuIcon)!;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  // Close the menu whenever the page changes
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === `/${locale}` ? pathname === href : pathname.startsWith(href));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" aria-label={labels.menu} className="flex size-10 items-center justify-center lg:hidden">
          <MenuIcon className="size-6" />
        </button>
      </SheetTrigger>

      <SheetContent side="start" closeLabel={labels.close} className="text-foreground">
        <SheetHeader>
          <SheetTitle>{storeName}</SheetTitle>
          <SheetDescription className="sr-only">{labels.menu}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {/* Search */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/${locale}/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
              setOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg border px-3"
          >
            <Search className="size-4 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={labels.searchPlaceholder}
              aria-label={labels.search}
              className="h-11 flex-1 bg-transparent text-base outline-none"
            />
          </form>

          {/* Main links */}
          <nav>
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l.href}>
                  <SheetClose asChild>
                    <Link href={l.href} className={cn("block rounded-lg px-3 py-3 text-base font-medium hover:bg-muted", isActive(l.href) && "bg-secondary")}>
                      {l.label}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </nav>

          {/* Categories */}
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{labels.categories}</p>
            <ul className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <li key={c.href}>
                  <SheetClose asChild>
                    <Link href={c.href} className={cn("block rounded-lg border px-3 py-2.5 text-sm hover:border-primary", isActive(c.href) && "border-primary bg-secondary")}>
                      {c.label}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-1 border-t pt-4">
            <SheetClose asChild>
              <Link href={`/${locale}/account`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted">
                <UserRound className="size-5 text-primary" />
                {labels.myAccount}
              </Link>
            </SheetClose>
            <div className="flex gap-2 px-3 pt-1 text-sm">
              <SheetClose asChild>
                <Link href={`/${locale}/login`} className="text-primary hover:underline">{labels.login}</Link>
              </SheetClose>
              <span className="text-muted-foreground">·</span>
              <SheetClose asChild>
                <Link href={`/${locale}/register`} className="text-primary hover:underline">{labels.register}</Link>
              </SheetClose>
            </div>
          </div>
        </div>

        {/* Bottom: language + contact */}
        <div className="space-y-3 border-t p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{labels.language}</span>
            <span className="rounded-md border px-3 py-1.5">
              <LanguageSwitcher locale={locale} label={labels.switchLanguage} />
            </span>
          </div>
          <div className="flex gap-2">
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex flex-1 items-center justify-center gap-2 rounded-md border py-2.5 hover:bg-muted">
              <Phone className="size-4" /> <span dir="ltr">{phone}</span>
            </a>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex items-center justify-center rounded-md border px-4 text-emerald-600 hover:bg-muted">
                <MessageCircle className="size-5" />
              </a>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
