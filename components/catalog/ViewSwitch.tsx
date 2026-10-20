/**
 * GRID / BIG-CARDS SWITCH — two small buttons in the bar above the products.
 *   "Grid"  = the normal grid (products per row: dashboard → Theme & design → Layout)
 *   "Large" = big cards, 2 per row on computers, 1 on phones
 * Switched on in the dashboard → Product filter → "Grid / big cards buttons".
 * The visitor's choice is remembered in their browser. The CSS is in app/globals.css → ".product-grid[data-view]".
 */
"use client";

import { useEffect, useState } from "react";
import { Columns3, Rows2 } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "product-view";
type View = "grid" | "large";

export function ViewSwitch({ gridId, labels }: { gridId: string; labels: { grid: string; large: string } }) {
  const [view, setView] = useState<View>("grid");

  // Last choice of this visitor (the browser may block storage — then it just starts as a grid)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "grid" || saved === "large") setView(saved);
    } catch {}
  }, []);

  // Tell the grid which look to use
  useEffect(() => {
    document.getElementById(gridId)?.setAttribute("data-view", view);
  }, [view, gridId]);

  const choose = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  };

  const button = (v: View, Icon: typeof Columns3, label: string) => (
    <button type="button" aria-label={label} aria-pressed={view === v} title={label} onClick={() => choose(v)} className={cn("flex size-9 items-center justify-center transition-opacity", view === v ? "opacity-100" : "opacity-45 hover:opacity-80")}>
      <Icon className="size-6" strokeWidth={1.5} />
    </button>
  );

  return (
    <div className="flex items-center gap-1" role="group">
      {button("grid", Columns3, labels.grid)}
      {button("large", Rows2, labels.large)}
    </div>
  );
}
