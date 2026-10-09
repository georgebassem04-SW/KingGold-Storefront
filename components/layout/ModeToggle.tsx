/**
 * DARK MODE BUTTON — the sun / moon icon in the header.
 * Shown only when dark mode is switched on in the dashboard → Theme & design → Dark mode.
 *
 * How it works:
 *   - The mode is written on the page as <html data-mode="light | dark">; the dark colours (lib/theme.ts)
 *     apply while it says "dark".
 *   - The visitor's choice is saved on their device (localStorage "site-mode") so the next visit opens the same way.
 *   - Before they choose, the dashboard's "What visitors see first" decides.
 *   - A tiny script (lib/site-mode.ts) runs in <head> before the page is drawn, so there is no white flash.
 * Texts: i18n/dictionaries/*.json -> nav.darkMode / nav.lightMode
 */
"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { MODE_EVENT as EVENT, MODE_KEY as KEY } from "@/lib/site-mode";

const subscribe = (onChange: () => void) => {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
};
const current = () => (document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light");

export function ModeToggle({ labels, fallback, iconClass = "size-5" }: { labels: { dark: string; light: string }; fallback: "light" | "dark"; iconClass?: string }) {
  // On the server (and the very first draw) the dashboard's default is assumed; then the real mode is read from the page
  const mode = useSyncExternalStore(subscribe, current, () => fallback);
  const next = mode === "dark" ? "light" : "dark";
  const label = next === "dark" ? labels.dark : labels.light;

  function toggle() {
    document.documentElement.setAttribute("data-mode", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // private browsing: the choice just lasts for this page
    }
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className="nav-link flex size-9 items-center justify-center">
      {next === "dark" ? <Moon className={iconClass} /> : <Sun className={iconClass} />}
    </button>
  );
}
