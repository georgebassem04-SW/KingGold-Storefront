/** Countdown until the quoted gold price expires ("Prices locked for 14:32") */
"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { fill } from "@/lib/format";

export function PriceLockTimer({ validUntil, lockedLabel, expiredLabel }: { validUntil: string; lockedLabel: string; expiredLabel: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = Math.max(0, new Date(validUntil).getTime() - now);
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");

  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <Lock className="size-3.5" />
      {left > 0 ? fill(lockedLabel, { time: `${mm}:${ss}` }) : expiredLabel}
    </p>
  );
}
