/**
 * CHANGE / SET PASSWORD — POST /api/account/password
 * Body: { currentPassword?, newPassword, confirmPassword }
 * Customers who signed up with Google can set a first password (no current password needed).
 */
import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { sessionOr401 } from "@/lib/auth/route-helpers";
import { passwordChangeSchema, zodErrors } from "@/lib/validation/account";

export async function POST(request: NextRequest) {
  const { session, denied } = await sessionOr401();
  if (denied) return denied;

  const parsed = passwordChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation", errors: zodErrors(parsed.error) }, { status: 422 });

  const result = await api.changePassword(session, { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, errors: result.error === "wrong_password" ? { currentPassword: "wrongPassword" } : undefined },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, customer: result.customer });
}
