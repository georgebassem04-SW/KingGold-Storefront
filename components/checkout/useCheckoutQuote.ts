/**
 * useCheckoutQuote — keeps the checkout total up to date (runs in the browser).
 * ------------------------------------------------------------------
 * Asks /api/checkout/quote for the real price whenever the cart, delivery method,
 * area or coupon changes (TanStack Query caches and de-duplicates the requests).
 *
 * It also:
 *   - re-asks automatically when the price lock expires (quote.validUntil)
 *   - copies today's prices / available quantities back into the cart store
 *   - removes items that are sold out, and reports what changed (notices)
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { DeliveryMethod, Quote } from "@/types";
import { useCartStore } from "@/stores/cart-store";

export type QuoteNotice = "pricesUpdated" | "itemsRemoved" | "qtyReduced";

interface Params {
  deliveryMethod: DeliveryMethod;
  shippingZoneId?: string;
  couponCode?: string;
  enabled: boolean;
}

async function fetchQuote(body: unknown): Promise<Quote> {
  const res = await fetch("/api/checkout/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`quote ${res.status}`);
  return res.json();
}

export function useCheckoutQuote({ deliveryMethod, shippingZoneId, couponCode, enabled }: Params) {
  const items = useCartStore((s) => s.items);
  const syncWithQuote = useCartStore((s) => s.syncWithQuote);
  const queryClient = useQueryClient();
  const [notices, setNotices] = useState<QuoteNotice[]>([]);

  // Only ids + quantities go to the server; prices are never trusted from the browser
  const requestItems = items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  const queryKey = ["checkout-quote", requestItems, deliveryMethod, shippingZoneId ?? null, couponCode ?? null];

  const query = useQuery({
    queryKey,
    queryFn: () =>
      fetchQuote({ items: requestItems, deliveryMethod, shippingZoneId: shippingZoneId || undefined, couponCode: couponCode || undefined }),
    enabled: enabled && requestItems.length > 0,
    staleTime: 0,
    placeholderData: (previous) => previous, // keep showing the last total while updating
  });

  const quote = query.data;

  // Apply the quote to the cart: new prices, reduced quantities, removed items
  const lastApplied = useRef<Quote | undefined>(undefined);
  useEffect(() => {
    if (!quote || quote === lastApplied.current) return;
    lastApplied.current = quote;
    const current = useCartStore.getState().items;
    const found: QuoteNotice[] = [];
    if (quote.unavailable.length) found.push("itemsRemoved");
    for (const line of quote.lines) {
      const item = current.find((i) => i.variantId === line.variantId);
      if (!item) continue;
      if (item.quantity > line.quantity) found.push("qtyReduced");
      if (item.unitPrice !== line.unitPrice) found.push("pricesUpdated");
    }
    if (found.length) {
      setNotices([...new Set(found)]);
      syncWithQuote(quote.lines, quote.unavailable.map((u) => u.variantId));
    }
  }, [quote, syncWithQuote]);

  // When the price lock ends, ask again for today's price
  useEffect(() => {
    if (!quote) return;
    const ms = new Date(quote.validUntil).getTime() - Date.now();
    const timer = setTimeout(() => query.refetch(), Math.max(ms, 1000));
    return () => clearTimeout(timer);
  }, [quote, query]);

  /** Used when placing the order returns a newer quote ("price_changed") */
  const replaceQuote = (next: Quote) => queryClient.setQueryData(queryKey, next);

  return { quote, isFetching: query.isFetching, isError: query.isError, notices, clearNotices: () => setNotices([]), replaceQuote };
}
