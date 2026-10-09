/**
 * Tells the header when the page has been scrolled (sets data-scrolled="true" on it).
 * Used only by the see-through header (dashboard → Header → Colours): at the top of the page it is see-through
 * over the picture; once the visitor scrolls, it gets its normal colour back so the menu stays readable.
 * Renders nothing. The colours themselves are in app/globals.css.
 */
"use client";

import { useEffect } from "react";

export function HeaderScroll() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    const update = () => {
      if (window.scrollY > 8) header.dataset.scrolled = "true";
      else delete header.dataset.scrolled;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return null;
}
