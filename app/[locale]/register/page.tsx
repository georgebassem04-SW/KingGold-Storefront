/**
 * PAGE: /[locale]/register — SIGN UP
 * Name, email, mobile, password — or "Continue with Google". Already logged in -> goes to the account.
 * The form: components/auth/RegisterForm.tsx
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary } from "@/i18n/get-dictionary";
import { localePath } from "@/i18n/config";
import { getSession, safeReturnTo } from "@/lib/auth/session";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export async function generateMetadata({ params }: PageProps<"/[locale]/register">): Promise<Metadata> {
  const dict = await getDictionary((await params).locale as Locale);
  return { title: dict.pages.register, robots: { index: false } };
}

export default async function RegisterPage({ params, searchParams }: PageProps<"/[locale]/register">) {
  const locale = (await params).locale as Locale;
  const sp = await searchParams;
  const returnTo = safeReturnTo(typeof sp.returnTo === "string" ? sp.returnTo : undefined, `/${locale}/account`);
  if (await getSession()) redirect(returnTo);

  const dict = await getDictionary(locale);
  return (
    <AuthCard title={dict.auth.registerTitle} subtitle={dict.auth.registerSubtitle}>
      <RegisterForm locale={locale} labels={dict.auth} returnTo={returnTo} termsHref={localePath(locale, "/terms")} />
    </AuthCard>
  );
}
