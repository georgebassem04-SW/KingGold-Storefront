/**
 * FILTERS ON PHONES — a "Filters (3)" button that opens the filter panel from the bottom of the screen.
 * The list behind updates live; "Show N results" closes the panel.
 */
"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { fill } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileFilters({ labels, activeCount, total, children }: { labels: Dictionary["catalog"]; activeCount: number; total: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 lg:hidden">
          <SlidersHorizontal />
          {labels.filters}
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{activeCount}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" closeLabel="×">
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
