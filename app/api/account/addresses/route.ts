/**
 * ADD ADDRESS — POST /api/account/addresses
 * Body: { label, fullName, phone, shippingZoneId, city, area?, street, building?, notes?, isDefault }
 */
import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { sessionOr401 } from "@/lib/auth/route-helpers";
import { addressSchema, zodErrors } from "@/lib/validation/account";

export async function POST(request: NextRequest) {
  const { session, denied } = await sessionOr401();
  if (denied) return denied;

  const parsed = addressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation", errors: zodErrors(parsed.error) }, { status: 422 });

  const customer = await api.addAddress(session, { ...parsed.data, country: "EG" });
  if (!customer) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, customer });
}
