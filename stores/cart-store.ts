/**
 * SHOPPING CART (Zustand)
 * ------------------------------------------------------------------
 * Keeps the cart in the browser (localStorage, key "cart"), so it survives a page refresh
 * and is shared by every page (header count, product page, cart page).
 *
 *   add(item)                 -> add a product size (or increase its quantity). Returns the quantity now in the cart.
 *   remove(variantId)         -> remove a line
 *   setQuantity(variantId, n) -> change quantity (between 1 and the available stock)
 *   clear()                   -> empty the cart (after an order is placed)
 *   syncWithQuote(...)        -> apply today's prices/stock from the checkout quote
 *
 * One cart line = one VARIANT (e.g. ring size 54), because each size is a different ERP item
 * with its own weight and price.
 *
 * Use it in a client component:  const items = useCartStore((s) => s.items);
 */
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => number;
  remove: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  /** Updates prices/quantities from the checkout quote and removes lines that can't be bought */
  syncWithQuote: (lines: { variantId: string; unitPrice: number; quantity: number; available: number }[], removeIds: string[]) => void;
}

/** Keeps a quantity between 1 and the stock limit (if known) */
const clamp = (qty: number, max?: number) => Math.max(1, max ? Math.min(qty, max) : qty);

/** Cart kept in the browser (localStorage). Prices are re-checked by the API at checkout. */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) => {
        const existing = get().items.find((i) => i.variantId === item.variantId);
        if (existing) {
          const quantity = clamp(existing.quantity + item.quantity, item.maxQty ?? existing.maxQty);
          set((s) => ({
            items: s.items.map((i) =>
              // refresh price/stock with the latest values from the product page
              i.variantId === item.variantId ? { ...i, ...item, quantity } : i,
            ),
          }));
          return quantity;
        }
        const quantity = clamp(item.quantity, item.maxQty);
        set((s) => ({ items: [...s.items, { ...item, quantity }] }));
        return quantity;
      },

      remove: (variantId) => set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),

      setQuantity: (variantId, quantity) =>
        set((s) => ({
          items: s.items.map((i) => (i.variantId === variantId ? { ...i, quantity: clamp(quantity, i.maxQty) } : i)),
        })),

      clear: () => set({ items: [] }),

      syncWithQuote: (lines, removeIds) =>
        set((s) => ({
          items: s.items
            .filter((i) => !removeIds.includes(i.variantId))
            .map((i) => {
              const line = lines.find((l) => l.variantId === i.variantId);
              return line ? { ...i, unitPrice: line.unitPrice, quantity: line.quantity, maxQty: line.available } : i;
            }),
        })),
    }),
    { name: "cart" },
  ),
);

/** Total number of pieces (shown on the header cart icon) */
export const selectCartCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
/** Sum of all lines (unit price × quantity) */
export const selectCartSubtotal = (s: CartState) => s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
