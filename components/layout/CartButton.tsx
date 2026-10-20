/**
 * CART ICON in the header, with a small bubble showing how many items are in the cart.
 * The count is read from the cart store (stores/cart-store.ts).
 * Bubble colour = the client's primary colour (bg-primary).
 */
"use client";

import Link from "next/link";
import { DEFAULT_ICONS, iconFor } from "@/lib/icon-library";
import { useEffect, useState } from "react";
import { selectCartCount, useCartStore } from "@/stores/cart-store";

/**
 * `iconId` (from the icon library) and `iconClass` (size): chosen in the dashboard → Header → Icons.
 * `asText`: "Cart (2)" in words on computers instead of the icon (Header → Icons → "Show as words")
 */
export function CartButton({ href, label, iconId = DEFAULT_ICONS.cart, iconClass = "size-5", asText = false }: { href: string; label: string; iconId?: string; iconClass?: string; asText?: boolean }) {
  const Icon = iconFor("cart", iconId)!;
  const count = useCartStore(selectCartCount);

  // The cart is saved in the browser, so the count is only known after the page loads.
  // Showing it before that would cause a "hydration" warning in Next.js.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Link href={href} aria-label={label} className="nav-link relative">
      {asText && <span className="hidden whitespace-nowrap lg:inline">{label} ({mounted ? count : 0})</span>}
      <Icon className={asText ? `${iconClass} lg:hidden` : iconClass} />
      {/* Count bubble — only shown when the cart has items */}
      {mounted && count > 0 && (
        <span className={`absolute -top-2 -end-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground${asText ? " lg:hidden" : ""}`}>
          {count}
        </span>
      )}
    </Link>
  );
}
