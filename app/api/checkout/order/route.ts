/**
 * PLACE ORDER — POST /api/checkout/order
 * ------------------------------------------------------------------
 *   1. Re-checks the whole form with the same rules as the page (lib/validation/checkout.ts)
 *   2. Sends the order to the dashboard (lib/api -> POST /storefront/orders)
 *   3. The dashboard re-prices it; if today's total differs from what the customer saw,
 *      it answers "price_changed" with the new quote and the page asks the customer to confirm.
 *   4. On success, sends the confirmation email (lib/email/order-emails.ts) AFTER the answer
 *      has gone back to the browser, so the customer never waits for the email.
 *
 * Answers:
 *   200 { ok: true, orderNumber, total, paymentRedirectUrl? }
 *   409 { ok: false, error: "price_changed" | "unavailable" | "blocked" | "invalid_payment", quote? }
 *   422 { ok: false, error: "validation", errors: { field: code } }
 */
import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { api } from "@/lib/api";
import { cartItemsSchema, checkoutFormSchema } from "@/lib/validation/checkout";
import { sendOrderEmails } from "@/lib/email/order-emails";
import { getSession } from "@/lib/auth/session";
import { getSiteOptions } from "@/lib/store-contact";

const metaSchema = z.object({
  items: cartItemsSchema,
  expectedTotal: z.number().nonnegative(),
  idempotencyKey: z.string().min(8).max(100),
  locale: z.enum(["ar", "en"]),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const meta = metaSchema.safeParse(body);
  const form = checkoutFormSchema.safeParse(body?.form);

  if (!meta.success) return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  if (!form.success) {
    const errors = Object.fromEntries(form.error.issues.map((i) => [String(i.path[0]), i.message]));
    return NextResponse.json({ ok: false, error: "validation", errors }, { status: 422 });
  }

  const f = form.data;
  // Logged in? The order is linked to the account (taken from the session cookie, never from the browser body)
  const session = await getSession();
  // "Order without an account" switched off in the dashboard (Settings → Store details → Website options)
  if (!session && !(await getSiteOptions()).guestCheckout) return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  // Turn the zone id into its name for the address (the dashboard also gets the id)
  const options = await api.getCheckoutOptions();
  const zone = options.shippingZones.find((z) => z.id === f.shippingZoneId);

  try {
    const result = await api.placeOrder({
      items: meta.data.items,
      deliveryMethod: f.deliveryMethod,
      shippingZoneId: f.deliveryMethod === "delivery" ? f.shippingZoneId : undefined,
      couponCode: f.couponCode || undefined,
      customer: { name: f.name, phone: f.phone, email: f.email || undefined },
      address:
        f.deliveryMethod === "delivery"
          ? {
              governorate: zone ? zone.name[meta.data.locale] : (f.shippingZoneId ?? ""),
              city: f.city ?? "",
              area: f.area || undefined,
              street: f.street ?? "",
              building: f.building || undefined,
              notes: f.addressNotes || undefined,
            }
          : undefined,
      pickupBranchId: f.deliveryMethod === "store_pickup" ? f.pickupBranchId : undefined,
      paymentMethodId: f.paymentMethodId,
      notes: f.notes || undefined,
      locale: meta.data.locale,
      expectedTotal: meta.data.expectedTotal,
      idempotencyKey: meta.data.idempotencyKey,
      customerAuth: session ? { customerId: session.customerId, token: session.token } : undefined,
    });

    if (result.ok) {
      // "Save this address to my account"
      if (session && f.saveAddress && f.deliveryMethod === "delivery") {
        await api
          .addAddress(session, {
            label: zone ? zone.name[meta.data.locale] : f.city ?? "",
            fullName: f.name,
            phone: f.phone,
            country: "EG",
            shippingZoneId: f.shippingZoneId,
            city: f.city ?? "",
            area: f.area || undefined,
            street: f.street ?? "",
            building: f.building || undefined,
            notes: f.addressNotes || undefined,
            isDefault: false,
          })
          .catch((e) => console.error("could not save address", e));
      }
      // Runs after the response is sent. Set SEND_ORDER_EMAILS=false if the dashboard sends emails itself.
      if (process.env.SEND_ORDER_EMAILS !== "false") {
        after(async () => {
          const sent = await sendOrderEmails(result.orderNumber);
          console.log(`[email] order ${result.orderNumber}:`, sent);
        });
      }
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch (error) {
    console.error("place order failed", error);
    return NextResponse.json({ ok: false, error: "server" }, { status: 502 });
  }
}
