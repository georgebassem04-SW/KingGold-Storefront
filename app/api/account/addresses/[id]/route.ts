/**
 * EDIT / DELETE ADDRESS — PUT or DELETE /api/account/addresses/<id>
 * PUT body: same as adding an address.
 */
import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { sessionOr401 } from "@/lib/auth/route-helpers";
import { addressSchema, zodErrors } from "@/lib/validation/account";

export async function PUT(request: NextRequest, { params }: RouteContext<"/api/account/addresses/[id]">) {
  const { session, denied } = await sessionOr401();
  if (denied) return denied;
  const { id } = await params;

  const parsed = addressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation", errors: zodErrors(parsed.error) }, { status: 422 });

  const customer = await api.updateAddress(session, id, { ...parsed.data, country: "EG" });
  if (!customer) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, customer });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext<"/api/account/addresses/[id]">) {
  const { session, denied } = await sessionOr401();
  if (denied) return denied;
  const { id } = await params;

  const customer = await api.deleteAddress(session, id);
  if (!customer) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, customer });
}
