/**
 * QUOTE ENGINE (used by the MOCK API only)
 * ------------------------------------------------------------------
 * Works out the real price of a cart at checkout, the way the dashboard will:
 *   1. Looks up every item again (it may be sold out or unpublished now)
 *   2. Re-prices it with TODAY's gold rate (lib/pricing.ts)
 *   3. Applies special offers (lib/offers.ts), the coupon, shipping fee and VAT from the checkout options
 *
 * When the real API is connected, the dashboard does this calculation and this file is not used.
 * Keep it in step with the dashboard's rules so mock totals look realistic.
 */
import type { CheckoutOptions, GoldPrice, LocalizedText, Product, Quote, QuoteLine, QuoteRequest } from "@/types";
import { calculatePrice } from "@/lib/pricing";
import { offerFor, targetsProduct } from "./offer-math";

/**
 * Coupon as the dashboard sends it (mock: mock-data/coupons.json, or the dashboard → Gold prices & coupons).
 * Discounts never touch the gold value unless appliesTo = "subtotal".
 */
export interface Coupon {
  code: string;
  /** percent = % off · amount = fixed amount off · free_shipping = no delivery fee */
  type: "percent" | "amount" | "free_shipping";
  value: number;
  /** "making_charge": discount only the making charge; "subtotal": the whole order */
  appliesTo: "making_charge" | "subtotal";
  minSubtotal: number;
  /** Largest discount one order can get (for percent coupons) */
  maxDiscount?: number;
  label: LocalizedText;
  isActive: boolean;
  /** Valid from / until (ISO). Empty = no limit */
  startsAt?: string;
  endsAt?: string;
  /** How many orders can use it in total, and how many already did (sent by the dashboard) */
  usageLimit?: number;
  usedCount?: number;
  /** Only these products (empty / missing = the whole order). For these, a fixed amount is PER PIECE */
  productIds?: string[];
  /** true = a SPECIAL OFFER: applies by itself, the customer types no code (lib/offers.ts) */
  automatic?: boolean;
}

/** The special offers running now, in the shape the website shows (no codes) */
export function activeOffers(coupons: Coupon[], now = Date.now()): import("@/types").Offer[] {
  return coupons
    .filter((c) => c.automatic && c.type !== "free_shipping" && !couponProblem(c, Infinity, now))
    .map((c) => ({ label: c.label, type: c.type as "percent" | "amount", value: c.value, appliesTo: c.appliesTo, maxDiscount: c.maxDiscount, productIds: c.productIds ?? [], endsAt: c.endsAt }));
}

/** Checks one coupon for this order. Returns the reason when it can't be used. */
export function couponProblem(c: Coupon | undefined, subtotal: number, now = Date.now()): NonNullable<Quote["coupon"]>["reason"] | null {
  if (!c || !c.isActive) return "not_found";
  if (c.startsAt && Date.parse(c.startsAt) > now) return "not_started";
  if (c.endsAt && Date.parse(c.endsAt) < now) return "expired";
  if (c.usageLimit !== undefined && (c.usedCount ?? 0) >= c.usageLimit) return "used_up";
  if (subtotal < c.minSubtotal) return "min_subtotal";
  return null;
}

interface Inputs {
  request: QuoteRequest;
  products: Product[];
  goldPrices: GoldPrice[];
  options: CheckoutOptions;
  coupons: Coupon[];
  currency: string;
}

const round = (n: number) => Math.round(n);

export function buildQuote({ request, products, goldPrices, options, coupons, currency }: Inputs): Quote {
  const offers = activeOffers(coupons);
  const lines: QuoteLine[] = [];
  const unavailable: Quote["unavailable"] = [];

  // 1–2) Find each item again and re-price it
  for (const item of request.items) {
    const product = products.find((p) => p.variants.some((v) => v.id === item.variantId));
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!product || !variant) {
      unavailable.push({ variantId: item.variantId, reason: "not_found" });
      continue;
    }
    const madeToOrder = variant.stockStatus === "made_to_order";
    const available = madeToOrder ? item.quantity : variant.stockQty;
    if (available <= 0) {
      unavailable.push({ variantId: item.variantId, reason: "out_of_stock" });
      continue;
    }
    const quantity = Math.min(item.quantity, available);
    const price = calculatePrice(product, variant, goldPrices);
    // Special offer on this product? The piece is sold at the offer price (same function as the product page)
    const offer = offerFor(product.id, price, offers);
    const unit = offer ? offer.total : price.total;
    lines.push({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      sku: variant.sku,
      name: product.name,
      imageUrl: product.images[0]?.url,
      karat: product.karat,
      weightGrams: variant.weightGrams,
      size: variant.size && variant.size !== "one" ? variant.size : undefined,
      quantity,
      available,
      goldPricePerGram: goldPrices.find((g) => g.karat === product.karat)?.pricePerGram ?? 0,
      // The offer comes off the making charge first (matters when VAT is on the making charge only)
      makingCharge: round(Math.max(0, price.makingCharge - (offer?.discount ?? 0))),
      stonesPrice: round(price.stones),
      unitPrice: unit,
      lineTotal: unit * quantity,
      originalUnitPrice: offer ? price.total : undefined,
      offerLabel: offer?.label,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const makingTotal = lines.reduce((s, l) => s + l.makingCharge * l.quantity, 0);

  // 3a) Coupon (a code the customer typed). Special offers are not codes and can't be typed.
  //     A code for chosen products only counts those pieces; pieces already on a special offer are left out.
  let discount = 0;
  let coupon: Quote["coupon"];
  if (request.couponCode) {
    const code = request.couponCode.trim().toUpperCase();
    const c = coupons.find((x) => !x.automatic && x.code.toUpperCase() === code);
    const limited = !!c?.productIds?.length;
    const eligible = c ? lines.filter((l) => !l.originalUnitPrice && targetsProduct(c, l.productId)) : [];
    const reason = couponProblem(c, subtotal) ?? (c && c.type !== "free_shipping" && limited && eligible.length === 0 ? "not_applicable" : null);
    if (c && !reason) {
      if (c.type !== "free_shipping") {
        const pool = limited ? eligible : lines.filter((l) => !l.originalUnitPrice);
        const base = pool.reduce((s, l) => s + (c.appliesTo === "making_charge" ? l.makingCharge : l.unitPrice) * l.quantity, 0);
        const pieces = pool.reduce((s, l) => s + l.quantity, 0);
        // Fixed amount: once per order, or per piece when the code is for chosen products
        const raw = c.type === "percent" ? (base * c.value) / 100 : Math.min(c.value * (limited ? pieces : 1), base);
        discount = round(c.maxDiscount ? Math.min(raw, c.maxDiscount) : raw);
      }
      coupon = { code, valid: true, label: c.label, freeShipping: c.type === "free_shipping" || undefined };
    } else {
      coupon = { code, valid: false, reason: reason ?? "not_found", minSubtotal: reason === "min_subtotal" ? c?.minSubtotal : undefined };
    }
  }

  // 3b) Shipping (store pickup is free)
  let shipping = 0;
  if (request.deliveryMethod === "delivery") {
    const zone = options.shippingZones.find((z) => z.id === request.shippingZoneId && z.isActive);
    if (zone) shipping = coupon?.freeShipping || (zone.freeOver !== undefined && subtotal - discount >= zone.freeOver) ? 0 : zone.fee;
  }

  // 3c) VAT
  const vatBase =
    options.vatBase === "none"
      ? 0
      : options.vatBase === "making_charge"
        ? Math.max(0, makingTotal - (coupon?.valid && discount ? Math.min(discount, makingTotal) : 0))
        : subtotal - discount;
  const vat = round((vatBase * options.vatPercent) / 100);

  const total = subtotal - discount + shipping + vat;

  const blockers: Quote["blockers"] = [];
  if (lines.length === 0) blockers.push("empty");
  if (options.minOrderTotal && lines.length && subtotal < options.minOrderTotal) blockers.push("below_minimum");
  // A delivery area or store pickup switched off in the dashboard can't be used (never "free delivery" by mistake)
  if (request.deliveryMethod === "delivery" && request.shippingZoneId && !options.shippingZones.some((z) => z.id === request.shippingZoneId && z.isActive)) {
    blockers.push("zone_unavailable");
  }
  if (request.deliveryMethod === "store_pickup" && options.storePickup === false) blockers.push("pickup_unavailable");

  return {
    lines,
    unavailable,
    subtotal,
    discount,
    coupon,
    shipping,
    vat,
    total,
    currency,
    validUntil: new Date(Date.now() + options.priceLockMinutes * 60_000).toISOString(),
    blockers,
  };
}
