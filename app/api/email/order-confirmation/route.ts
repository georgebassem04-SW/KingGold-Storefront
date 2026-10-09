/**
 * SEND / RESEND ORDER CONFIRMATION EMAIL — POST /api/email/order-confirmation
 * ------------------------------------------------------------------
 * The confirmation is sent automatically after checkout. This endpoint lets the
 * dashboard send it again (e.g. a "Resend confirmation" button, or after staff fix an email address).
 *
 * Request:
 *   POST https://<store-domain>/api/email/order-confirmation
 *   Header:  x-api-secret: <EMAIL_API_SECRET from .env.local>
 *   Body:    { "orderNumber": "ORD-123456", "notifyStaff": false }
 *
 * Answer:
 *   200 { ok: true, customer: {...}, staff: "skipped_not_configured" }
 *   401 wrong secret · 404 order not found · 400 bad body
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendOrderEmails } from "@/lib/email/order-emails";

const bodySchema = z.object({
  orderNumber: z.string().min(3).max(40),
  notifyStaff: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-api-secret");
  if (!process.env.EMAIL_API_SECRET || secret !== process.env.EMAIL_API_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });

  const result = await sendOrderEmails(parsed.data.orderNumber, { staff: parsed.data.notifyStaff ?? false });
  if (!result) return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });

  return NextResponse.json({ ok: true, ...result });
}
