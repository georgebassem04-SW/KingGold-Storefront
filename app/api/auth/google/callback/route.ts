/**
 * SIGN IN WITH GOOGLE, step 2 — GET /api/auth/google/callback?code=…&state=…
 * Google sends the visitor back here. We check the state, get the verified profile,
 * find or create the customer in the dashboard, start the session, and go back to where they were.
 */
import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { fetchGoogleProfile } from "@/lib/auth/google";
import { createSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const saved = request.cookies.get("google_oauth")?.value;
  const { state, codeVerifier, returnTo, locale } = saved
    ? (JSON.parse(saved) as { state: string; codeVerifier: string; returnTo: string; locale: string })
    : { state: "", codeVerifier: "", returnTo: "/ar/account", locale: "ar" };

  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/${locale}/login?error=${reason}`, request.url));
    res.cookies.delete({ name: "google_oauth", path: "/api/auth/google" });
    return res;
  };

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return fail("google_cancelled"); // visitor pressed "Cancel" on Google
  if (!saved || !params.get("code") || params.get("state") !== state) return fail("google_failed");

  try {
    const profile = await fetchGoogleProfile(params.get("code")!, codeVerifier);
    if (!profile.emailVerified) return fail("google_unverified");

    const result = await api.loginWithGoogle(profile);
    if (!result.ok) return fail(result.error === "account_disabled" ? "account_disabled" : "google_failed");
    await createSession(result.customer, result.token);

    // New Google customers have no phone yet -> send them to complete their profile first
    const target = result.customer.phone ? returnTo : `/${locale}/account/profile?complete=1`;
    const res = NextResponse.redirect(new URL(target, request.url));
    res.cookies.delete({ name: "google_oauth", path: "/api/auth/google" });
    return res;
  } catch (error) {
    console.error("Google sign-in failed", error);
    return fail("google_failed");
  }
}
