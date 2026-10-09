/**
 * SIGN UP — POST /api/auth/register
 * Body: { firstName, lastName, email, phone, password, confirmPassword }
 * Creates the customer in the dashboard, then logs them in (session cookie).
 */
import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { createSession } from "@/lib/auth/session";
import { registerSchema, zodErrors } from "@/lib/validation/account";

export async function POST(request: NextRequest) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation", errors: zodErrors(parsed.error) }, { status: 422 });

  const { confirmPassword: _c, ...input } = parsed.data;
  const result = await api.registerCustomer(input);
  if (!result.ok) {
    // e.g. email_taken -> shown under the email field
    return NextResponse.json({ ok: false, error: result.error, errors: result.error === "email_taken" ? { email: "emailTaken" } : undefined }, { status: 409 });
  }
  await createSession(result.customer, result.token);
  return NextResponse.json({ ok: true });
}
