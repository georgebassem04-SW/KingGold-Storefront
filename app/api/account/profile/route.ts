/**
 * EDIT PROFILE — PATCH /api/account/profile
 * Body: { firstName, lastName, email, phone, birthDate, marketingOptIn }
 * Only for the logged-in customer (session cookie). Updates the session name/email too.
 */
import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { createSession } from "@/lib/auth/session";
import { sessionOr401 } from "@/lib/auth/route-helpers";
import { profileSchema, zodErrors } from "@/lib/validation/account";

export async function PATCH(request: NextRequest) {
  const { session, denied } = await sessionOr401();
  if (denied) return denied;

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation", errors: zodErrors(parsed.error) }, { status: 422 });

  const result = await api.updateCustomer(session, { ...parsed.data, birthDate: parsed.data.birthDate || undefined });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, errors: result.error === "email_taken" ? { email: "emailTaken" } : undefined }, { status: 409 });
  }
  await createSession(result.customer, session.token);
  return NextResponse.json({ ok: true, customer: result.customer });
}
