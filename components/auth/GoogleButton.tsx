/**
 * "Continue with Google" button. It is a plain link to /api/auth/google, which sends the
 * visitor to Google and back (see lib/auth/google.ts). Works for both sign-up and log-in.
 */
import { FcGoogle } from "react-icons/fc";
import type { Locale } from "@/types";

export function GoogleButton({ locale, returnTo, label }: { locale: Locale; returnTo: string; label: string }) {
  const href = `/api/auth/google?locale=${locale}&returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <a
      href={href}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-md border bg-background text-sm font-medium transition-colors hover:bg-muted"
    >
      <FcGoogle className="size-5" />
      {label}
    </a>
  );
}

/** The "— or —" line between Google and the email form */
export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
