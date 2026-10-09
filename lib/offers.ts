/**
 * SPECIAL OFFERS — automatic discounts on chosen products (no code to type).
 * ------------------------------------------------------------------
 * Created in the dashboard → Gold prices & coupons → "Special offer (no code)". The customer sees the old price
 * crossed out and the new price on the product card, the product page, the cart and the checkout.
 *
 *   getActiveOffers()          -> the offers running now (one request per page)
 *   offerFor(productId, price) -> the best offer for ONE piece of this product: { discount, total, label, percent }
 *                                 or null when no offer applies
 * The same function is used for display AND by the checkout calculation (lib/checkout/quote.ts),
 * so the price the customer sees is the price they pay.
 *
 * Rules:
 *   - "% of making charge" / "% of the piece" / "fixed amount": always PER PIECE
 *   - "Up to" (max discount) limits the discount of each piece
 *   - an offer with no chosen products applies to every product
 *   - when two offers match, the bigger discount wins (they are never added together)
 */
import { cache } from "react";
import type { Offer } from "@/types";
import { api } from "@/lib/api";

export { offerFor, pieceDiscount, targetsProduct, type OfferResult } from "@/lib/checkout/offer-math";

/** Running offers, asked once per page. If the dashboard can't be reached: no offers (normal prices). */
export const getActiveOffers = cache(async (): Promise<Offer[]> => api.getOffers().catch(() => []));
