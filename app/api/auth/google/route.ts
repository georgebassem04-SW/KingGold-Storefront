/**
 * SIGN IN WITH GOOGLE, step 1 — GET /api/auth/google?locale=ar&returnTo=/ar/account
 * Saves the security values in a short-lived cookie and sends the visitor to Google.
 * See lib/auth/google.ts for the setup (client id / secret / redirect URI).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createOAuthSecrets, googleAuthUrl, isGoogleConfigured } from "@/lib/auth/google";
import { safeReturnTo } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "ar";
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"), `/${locale}/account`);

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=google_not_configured`, request.url));
  }

  const { state, codeVerifier, codeChallenge } = createOAuthSecrets();
  const response = NextResponse.redirect(googleAuthUrl({ state, codeChallenge, locale }));
  response.cookies.set("google_oauth", JSON.stringify({ state, codeVerifier, returnTo, locale }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 10 * 60, // 10 minutes to finish signing in
  });
  return response;
}
