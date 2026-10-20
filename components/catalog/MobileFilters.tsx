/**
 * FILTER BUTTON — a "Filter (3)" button that opens the filter panel.
 *   Phones: always, sliding up from the bottom.
 *   Computers: only when the dashboard → Product filter → "How it shows" is "Button that opens a panel"
 *              (`onDesktop`), sliding in from the chosen side (`side`).
 * Button look (icon / word / both): the same dashboard page. The list behind updates live; "Show N results" closes the panel.
 */
"use client";

import { useEffect, useState } from "react";
import { DEFAULT_ICONS, iconFor } from "@/lib/icon-library";
import type { Dictionary } from "@/i18n/get-dictionary";
import { fill } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileFilters({
  labels,
  activeCount,
  total,
  children,
  onDesktop = false,
  side = "start",
  look = "both",
  iconId = DEFAULT_ICONS.filter,
}: {
  labels: Dictionary["catalog"];
  activeCount: number;
  total: number;
  children: React.ReactNode;
  onDesktop?: boolean;
  side?: "start" | "end";
  look?: "icon" | "text" | "both";
  /** Drawing of the button — dashboard → Product filter → Button icon (lib/icon-library.ts → filter) */
  iconId?: string;
}) {
  const Icon = iconFor("filter", iconId)!;
  const [open, setOpen] = useState(false);
  // Phones always slide up from the bottom; computers slide in from the chosen side
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={look === "both" || look === "icon" ? "ghost" : "outline"} size="sm" aria-label={labels.filters} className={cn("h-9", !onDesktop && "lg:hidden", look !== "both" && "lg:px-2")}>
          {/* Phones: icon + word. Computers: the look chosen in the dashboard */}
          <Icon className={cn("size-4", look === "text" && "lg:hidden")} />
          <span className={cn(look === "icon" && "lg:sr-only")}>{labels.filters}</span>
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{activeCount}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side={wide && onDesktop ? side : "bottom"} closeLabel="×">
        <SheetHeader>
          <SheetTitle>{labels.filters}</SheetTitle>
          <SheetDescription className="sr-only">{labels.filters}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        <div className="border-t p-4">
          <Button className="w-full" size="lg" onClick={() => setOpen(false)}>
            {fill(labels.showResults, { count: total })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
