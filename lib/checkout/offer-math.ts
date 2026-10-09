/**
 * SPECIAL OFFER MATHS — how much an offer takes off one piece. No data loading here (see lib/offers.ts for the rules
 * in plain words and for getActiveOffers()). Used by the product card / page AND the checkout calculation (quote.ts).
 */
import type { LocalizedText, Offer } from "@/types";

export interface OfferResult {
  /** Amount taken off ONE piece */
  discount: number;
  /** Price of one piece after the offer */
  total: number;
  label: LocalizedText;
  /** Rounded "% off" for the badge */
  percent: number;
}

/** true when the offer / coupon is for this product (no list = every product) */
export const targetsProduct = (o: { productIds?: string[] }, productId: string) => !o.productIds?.length || o.productIds.includes(productId);

/** Discount of one offer on one piece */
export function pieceDiscount(o: Pick<Offer, "type" | "value" | "appliesTo" | "maxDiscount">, price: { total: number; makingCharge: number }): number {
  const base = o.appliesTo === "making_charge" ? price.makingCharge : price.total;
  const raw = o.type === "percent" ? (base * o.value) / 100 : Math.min(o.value, base);
  return Math.max(0, Math.round(o.maxDiscount ? Math.min(raw, o.maxDiscount) : raw));
}

export function offerFor(productId: string, price: { total: number; makingCharge: number }, offers: Offer[]): OfferResult | null {
  let best: OfferResult | null = null;
  for (const o of offers) {
    if (!targetsProduct(o, productId)) continue;
    const discount = Math.min(pieceDiscount(o, price), price.total);
    if (discount > 0 && (!best || discount > best.discount)) {
      best = { discount, total: price.total - discount, label: o.label, percent: price.total ? Math.round((discount / price.total) * 100) : 0 };
    }
  }
  return best;
}
