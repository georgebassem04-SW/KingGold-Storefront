/**
 * LOGIN SESSION — who is logged in, kept in a secure cookie.
 * ------------------------------------------------------------------
 * After a successful login / sign-up / Google sign-in we save a small signed token
 * (JWT) in the cookie "session":
 *   - httpOnly: JavaScript in the page can't read it (protects against stolen sessions)
 *   - signed with AUTH_SECRET (.env.local): nobody can fake or edit it
 *   - lasts SESSION_DAYS days
 * It holds only the customer id, first name and the dashboard's token — never the password.
 *
 * Use on the server:
 *   const session = await getSession();          // null when logged out
 *   const session = await requireSession(locale) // sends to the login page when logged out
 */
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import type { Customer, CustomerAuth } from "@/types";

const COOKIE = "session";
const SESSION_DAYS = 30;

export interface Session extends CustomerAuth {
  firstName: string;
  email: string;
}

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (32+ characters) in production");
    // Development fallback so the project runs without setup. NEVER used in production.
    return new TextEncoder().encode("dev-only-secret-change-me-dev-only-secret-change-me");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(customer: Customer, token?: string) {
  const jwt = await new SignJWT({ firstName: customer.firstName, email: customer.email, token })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customer.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  (await cookies()).set(COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<Session | null> {
  const jwt = (await cookies()).get(COOKIE)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, secretKey());
    return {
      customerId: payload.sub as string,
      firstName: String(payload.firstName ?? ""),
      email: String(payload.email ?? ""),
      token: payload.token as string | undefined,
    };
  } catch {
    return null; // expired or tampered
  }
}

/** For account pages: logged-out visitors go to login and come back afterwards */
export async function requireSession(locale: string, returnTo: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session;
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Only allow returning to our own pages after login (stops redirects to other websites) */
export function safeReturnTo(value: string | null | undefined, fallback: string): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
