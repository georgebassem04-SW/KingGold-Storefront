/**
 * LOG IN — POST /api/auth/login
 * Body: { email, password }
 * Same answer for "no such email" and "wrong password", so nobody can find out which emails have accounts.
 */
import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { createSession } from "@/lib/auth/session";
import { loginSchema, zodErrors } from "@/lib/validation/account";

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation", errors: zodErrors(parsed.error) }, { status: 422 });

  const result = await api.loginCustomer(parsed.data);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 401 });

  await createSession(result.customer, result.token);
  return NextResponse.json({ ok: true });
}
