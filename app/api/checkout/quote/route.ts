/**
 * CHECKOUT QUOTE — POST /api/checkout/quote
 * ------------------------------------------------------------------
 * The checkout page calls this whenever the cart, delivery choice, area or coupon changes.
 * It asks the dashboard for the REAL price (today's gold rate, stock, coupon, shipping, VAT).
 * Only item ids and quantities are accepted from the browser — never prices.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { api } from "@/lib/api";
import { cartItemsSchema } from "@/lib/validation/checkout";

const bodySchema = z.object({
  items: cartItemsSchema,
  deliveryMethod: z.enum(["delivery", "store_pickup"]),
  shippingZoneId: z.string().optional(),
  couponCode: z.string().trim().max(30).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  try {
    const quote = await api.quoteOrder(parsed.data);
    return NextResponse.json(quote);
  } catch (error) {
    console.error("quote failed", error);
    return NextResponse.json({ error: "server" }, { status: 502 });
  }
}
