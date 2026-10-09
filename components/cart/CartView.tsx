/**
 * CART VIEW (runs in the browser) — the list of items in the cart + order summary.
 * ------------------------------------------------------------------
 * Reads and changes the cart store (stores/cart-store.ts):
 *   - quantity − / +  (never above the pieces in stock)
 *   - remove a line
 *   - subtotal = sum of (unit price × quantity)
 * Prices are the ones shown when the item was added; checkout will re-price with today's gold rate.
 *
 * Where to edit:
 *   - Texts (AR/EN)  -> i18n/dictionaries/*.json -> "cart"
 *   - Image size     -> "size-24" below
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { Locale } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { selectCartCount, selectCartSubtotal, useCartStore } from "@/stores/cart-store";
import { formatPrice, formatWeight, t } from "@/lib/format";
import { localePath } from "@/i18n/config";
import { Button } from "@/components/ui/button";

interface Props {
  locale: Locale;
  labels: Dictionary["cart"];
  productLabels: Dictionary["product"];
  currency: string;
  showWeight: boolean;
}

export function CartView({ locale, labels, productLabels, currency, showWeight }: Props) {
  const items = useCartStore((s) => s.items);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);

  // The cart lives in the browser, so wait until the page has loaded before showing it
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const p = (path: string) => localePath(locale, path);
  const price = (n: number) => formatPrice(n, items[0]?.currency ?? currency, locale);

  if (!mounted) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  // ===== EMPTY CART =====
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border py-16 text-center">
        <ShoppingBag className="mb-4 size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{labels.empty}</h2>
        <p className="mt-2 text-muted-foreground">{labels.emptyText}</p>
        <Button asChild className="mt-6">
          <Link href={p("/products")}>{labels.continue}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {/* ===== ITEMS ===== */}
      <ul className="divide-y rounded-xl border">
        {items.map((item) => {
          const atMax = item.maxQty !== undefined && item.quantity >= item.maxQty;
          return (
            <li key={item.variantId} className="flex gap-4 p-4">
              <Link href={p(`/products/${item.slug}`)} className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="96px" className="object-cover" />}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={p(`/products/${item.slug}`)} className="font-medium hover:text-primary">
                      {t(item.name, locale)}
                    </Link>
                    {/* karat · weight · size */}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.karat}K
                      {showWeight && <> · {formatWeight(item.weightGrams, locale)} {productLabels.grams}</>}
                      {item.size && <> · {productLabels.size}: {item.size}</>}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{price(item.unitPrice * item.quantity)}</p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-3">
                  {/* quantity stepper */}
                  <div className="flex items-center rounded-md border">
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center disabled:opacity-40"
                      onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label={labels.decrease}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center disabled:opacity-40"
                      onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                      disabled={atMax}
                      aria-label={labels.increase}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(item.variantId)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    {labels.remove}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ===== ORDER SUMMARY ===== */}
      <aside className="h-fit space-y-4 rounded-xl bg-secondary p-6">
        <h2 className="text-lg font-semibold">{labels.orderSummary}</h2>
        <div className="flex justify-between">
          <span>
            {labels.subtotal} ({count} {labels.items})
          </span>
          <strong>{price(subtotal)}</strong>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{labels.priceNote}</p>
        <Button asChild size="lg" className="w-full">
          <Link href={p("/checkout")}>{labels.checkout}</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href={p("/products")}>{labels.continue}</Link>
        </Button>
      </aside>
    </div>
  );
}
