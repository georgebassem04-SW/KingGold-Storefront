/**
 * SEARCH in the header — a magnifier button that opens a search bar under the header.
 * Searching goes to /products?q=… (results with filters and sorting).
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { DEFAULT_ICONS, iconFor } from "@/lib/icon-library";
import type { Locale } from "@/types";

/** `iconId` (from the icon library) and `iconClass` (size): chosen in the dashboard → Header → Icons */
export function HeaderSearch({ locale, label, placeholder, iconClass = "size-5", iconId = DEFAULT_ICONS.search }: { locale: Locale; label: string; placeholder: string; iconClass?: string; iconId?: string }) {
  const Icon = iconFor("search", iconId)!;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={label} aria-expanded={open} className="nav-link flex size-9 items-center justify-center">
        {open ? <X className={iconClass} /> : <Icon className={iconClass} />}
      </button>
      {open && (
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = text.trim();
            router.push(`/${locale}/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
            setOpen(false);
          }}
          className="absolute inset-x-0 top-full z-30 border-b bg-background p-3 text-foreground shadow-md"
        >
          <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-lg border bg-background px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              ref={input}
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              placeholder={placeholder}
              aria-label={label}
              className="h-11 flex-1 bg-transparent text-base outline-none"
            />
          </div>
        </form>
      )}
    </>
  );
}
