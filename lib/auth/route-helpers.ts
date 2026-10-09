/** Shared bits for the /api/account/* routes */
import "server-only";
import { NextResponse } from "next/server";
import { getSession, type Session } from "./session";

/** Returns the session, or a 401 answer to send back when logged out */
export async function sessionOr401(): Promise<{ session: Session; denied?: never } | { session?: never; denied: NextResponse }> {
  const session = await getSession();
  if (!session) return { denied: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }) };
  return { session };
}
