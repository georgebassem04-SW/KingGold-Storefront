/**
 * CONTACT FORM ENDPOINT — POST /api/contact
 * ------------------------------------------------------------------
 * The contact form in the browser sends here; this route:
 *   1. Re-checks every field with the same rules as the form (lib/validation/contact.ts)
 *   2. Drops spam silently (hidden "website" field filled = a bot)
 *   3. Forwards the message to the dashboard (lib/api -> POST /storefront/contact-messages)
 *
 * Why not send straight from the browser to the dashboard? This way the dashboard address and
 * any API keys stay on the server, and bad data never reaches the dashboard.
 */
import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { contactSchema } from "@/lib/validation/contact";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });

  // Bot trap: pretend it worked, store nothing
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    // field -> error code, e.g. { phone: "invalidPhone" }
    const errors = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]));
    return NextResponse.json({ ok: false, error: "validation", errors }, { status: 422 });
  }

  const locale = body.locale === "en" ? "en" : "ar";
  try {
    const { website: _bot, ...clean } = parsed.data;
    const result = await api.sendContactMessage({
      ...clean,
      locale,
      pageUrl: request.headers.get("referer") ?? undefined,
    });
    return NextResponse.json({ ok: result.ok, reference: result.reference });
  } catch (error) {
    console.error("contact message failed", error);
    return NextResponse.json({ ok: false, error: "server" }, { status: 502 });
  }
}
