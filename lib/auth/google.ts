/**
 * SIGN IN WITH GOOGLE (OAuth 2.0 / OpenID Connect) — no extra library.
 * ------------------------------------------------------------------
 * 1. /api/auth/google          -> sends the visitor to Google's sign-in page
 * 2. Google asks the visitor to choose an account and agree
 * 3. /api/auth/google/callback -> Google sends back a one-time code; we exchange it
 *    (server-to-server, with our secret) for the person's verified name and email
 *
 * Needs in .env.local (from Google Cloud Console -> APIs & Services -> Credentials -> OAuth client ID, type "Web"):
 *   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
 *   GOOGLE_CLIENT_SECRET=...
 *   NEXT_PUBLIC_SITE_URL=https://your-store.com
 * and in the Google console add this "Authorized redirect URI":
 *   https://your-store.com/api/auth/google/callback      (and http://localhost:3000/api/auth/google/callback for development)
 */
import "server-only";
import { createHash, randomBytes } from "node:crypto";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const isGoogleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const googleRedirectUri = () =>
  `${(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/auth/google/callback`;

const base64url = (buf: Buffer) => buf.toString("base64url");

/** Random values that protect the sign-in from being hijacked (state) or intercepted (PKCE) */
export function createOAuthSecrets() {
  const state = base64url(randomBytes(24));
  const codeVerifier = base64url(randomBytes(32));
  const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest());
  return { state, codeVerifier, codeChallenge };
}

export function googleAuthUrl({ state, codeChallenge, locale }: { state: string; codeChallenge: string; locale: string }) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
    hl: locale, // Google's page in Arabic or English
  });
  return `${AUTH_URL}?${params}`;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

/** Exchange Google's one-time code for the person's profile */
export async function fetchGoogleProfile(code: string, codeVerifier: string): Promise<GoogleProfile> {
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      code_verifier: codeVerifier,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error(`Google token exchange failed: ${tokenRes.status}`);
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const infoRes = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!infoRes.ok) throw new Error(`Google userinfo failed: ${infoRes.status}`);
  const info = (await infoRes.json()) as {
    sub: string;
    email: string;
    email_verified: boolean;
    given_name?: string;
    family_name?: string;
    name?: string;
    picture?: string;
  };

  const [first, ...rest] = (info.name ?? "").split(" ");
  return {
    googleId: info.sub,
    email: info.email,
    emailVerified: info.email_verified,
    firstName: info.given_name ?? first ?? "",
    lastName: info.family_name ?? rest.join(" "),
    avatarUrl: info.picture,
  };
}
