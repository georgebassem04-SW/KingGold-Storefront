/**
 * SEARCH in the header — a magnifier button that opens a search bar under the header.
 * Searching goes to /products?q=… (results with filters and sorting).
 *
 * Where to edit:
 *   - Look of the bar (simple / framed, width, words, colours, ✕ button) -> dashboard → Header → Search bar
 *     (saved in theme.header.search · defaults and ready-made looks: lib/theme-chrome.ts → DEFAULT_SEARCH / SEARCH_PRESETS)
 *   - Default words ("Search products…")                                  -> i18n/dictionaries/*.json → "catalog"
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Search, X } from "lucide-react";
import { DEFAULT_ICONS, iconFor } from "@/lib/icon-library";
import { DEFAULT_SEARCH } from "@/lib/theme-chrome";
import type { HeaderSearchStyle, Locale } from "@/types";
import { cn } from "@/lib/utils";

/** The look with its words already in the visitor's language (Header.tsx does that) */
export type SearchLook = Omit<HeaderSearchStyle, "placeholder" | "buttonText"> & { buttonText: string };

/**
 * `iconId` (from the icon library) and `iconClass` (size): chosen in the dashboard → Header → Icons.
 * `asText`: show the word "Search" instead of the icon on computers (Header → Icons → "Show as words")
 * `placeholder`: words in the field (dashboard text, or the default from the dictionary)
 */
export function HeaderSearch({
  locale,
  label,
  placeholder,
  iconClass = "size-5",
  iconId = DEFAULT_ICONS.search,
  asText = false,
  look = { ...DEFAULT_SEARCH, buttonText: "" },
}: {
  locale: Locale;
  label: string;
  placeholder: string;
  iconClass?: string;
  iconId?: string;
  asText?: boolean;
  look?: SearchLook;
}) {
  const Icon = iconFor("search", iconId)!;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    router.push(`/${locale}/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    setOpen(false);
  }

  const field = (
    <input
      ref={input}
      type="search"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      placeholder={look.floatingLabel ? "" : placeholder}
      aria-label={label}
      className={cn("flex-1 bg-transparent text-base outline-none", look.look === "boxed" ? "h-14 w-full px-6" : "h-11", look.floatingLabel && "pt-4")}
    />
  );

  // Colours: "" = automatic from the site colours (CSS variables of the theme)
  const vars = {
    "--sb-bg": look.fieldBackground || "color-mix(in srgb, var(--foreground) 3%, var(--background))",
    "--sb-border": look.fieldBorder || "var(--primary)",
    "--sb-label": look.labelColor || "var(--primary)",
    "--sb-btn": look.buttonColor || "var(--primary)",
    "--sb-btn-text": look.buttonTextColor || "var(--primary-foreground)",
    "--sb-btn-hover": look.buttonHoverColor || "var(--accent)",
    "--sb-btn-hover-text": look.buttonHoverTextColor || "var(--primary)",
    "--sb-close": look.closeColor || "var(--primary)",
  } as CSSProperties;

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={label} aria-expanded={open} className={asText ? "nav-link flex h-9 items-center justify-center px-1" : "nav-link flex size-9 items-center justify-center"}>
        {open ? <X className={iconClass} /> : <Icon className={asText ? `${iconClass} lg:hidden` : iconClass} />}
        {asText && !open && <span className="hidden whitespace-nowrap lg:inline">{label}</span>}
      </button>
      {open && (
        <form role="search" onSubmit={submit} style={vars} className="absolute inset-x-0 top-full z-30 border-b bg-background p-3 text-foreground shadow-md md:py-4">
          {look.look === "simple" ? (
            /* SIMPLE: rounded field with a small magnifier */
            <div className={cn("mx-auto flex items-center gap-2 rounded-lg border bg-background px-3", look.width === "full" ? "max-w-none px-4 md:mx-6" : "max-w-3xl")}>
              <Search className="size-4 text-muted-foreground" />
              {look.floatingLabel ? <FloatingLabel text={placeholder} simple>{field}</FloatingLabel> : field}
            </div>
          ) : (
            /* BOXED: framed field · coloured search button · ✕ button */
            <div className={cn("mx-auto flex items-stretch gap-3 md:gap-5", look.width === "full" ? "max-w-none md:px-6" : "max-w-4xl")}>
              <div className="relative flex min-w-0 flex-1 border bg-[var(--sb-bg)] [border-color:var(--sb-border)]">
                {look.floatingLabel ? <FloatingLabel text={placeholder}>{field}</FloatingLabel> : field}
              </div>
              <button
                type="submit"
                aria-label={label}
                className={cn(
                  "group/sb flex shrink-0 items-center justify-center gap-2 border border-transparent px-5 font-medium tracking-wide transition-colors md:min-w-36",
                  "bg-[var(--sb-btn)] text-[var(--sb-btn-text)] hover:bg-[var(--sb-btn-hover)] hover:text-[var(--sb-btn-hover-text)]",
                )}
              >
                <Search className="size-5" />
                {look.buttonText && (
                  <span className={cn("hidden md:inline", look.buttonTextOn === "hover" && "md:hidden md:group-hover/sb:inline md:group-focus-visible/sb:inline")}>{look.buttonText}</span>
                )}
              </button>
              {look.closeButton && (
                <button type="button" onClick={() => setOpen(false)} aria-label="✕" className="flex w-14 shrink-0 items-center justify-center bg-[var(--sb-close)] text-white transition-opacity hover:opacity-85">
                  <X className="size-6" />
                </button>
              )}
            </div>
          )}
        </form>
      )}
    </>
  );
}

/** The words as a small title in the top corner of the field (dashboard → Search bar → "Words as a small title on top") */
function FloatingLabel({ text, simple, children }: { text: string; simple?: boolean; children: React.ReactNode }) {
  return (
    <label className="relative flex min-w-0 flex-1">
      <span className={cn("pointer-events-none absolute top-1.5 text-xs text-[var(--sb-label)]", simple ? "start-0" : "start-6")}>{text}</span>
      {children}
    </label>
  );
}
