/**
 * PAGE: /[locale]/account/profile — ACCOUNT DETAILS
 * Edit name, email, mobile, birthday, offers opt-in; change or set the password;
 * see which sign-in methods are linked (email/password, Google).
 * ?complete=1 shows a note asking new Google customers to add their mobile number.
 */
import type { Metadata } from "next";
import { FcGoogle } from "react-icons/fc";
import { KeyRound } from "lucide-react";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import { getDictionary } from "@/i18n/get-dictionary";
import { FormAlert } from "@/components/forms/FormAlert";
import { ProfileForm } from "@/components/account/ProfileForm";
import { PasswordForm } from "@/components/account/PasswordForm";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/profile">): Promise<Metadata> {
  const dict = await getDictionary((await params).locale as Locale);
  return { title: dict.account.profileTitle, robots: { index: false } };
}

export default async function ProfilePage({ params, searchParams }: PageProps<"/[locale]/account/profile">) {
  const locale = (await params).locale as Locale;
  const session = await requireSession(locale, `/${locale}/account/profile`);
  const [dict, customer] = await Promise.all([getDictionary(locale), api.getCustomer(session)]);
  const A = dict.account;
  if (!customer) return null;
  const hasPassword = customer.authProviders.includes("password");
  const complete = (await searchParams).complete === "1" && !customer.phone;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{A.profileTitle}</h1>
        <p className="mt-2 text-muted-foreground">{A.profileSubtitle}</p>
      </header>
      {complete && <FormAlert tone="success">{A.completeProfile}</FormAlert>}

      <section className="rounded-xl border p-6">
        <ProfileForm customer={customer} labels={A} authLabels={dict.auth} />
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">{A.passwordTitle}</h2>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">{hasPassword ? A.passwordSubtitle : A.setPasswordSubtitle}</p>
        <PasswordForm hasPassword={hasPassword} labels={A} authLabels={dict.auth} />
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">{A.signInMethods}</h2>
        <ul className="flex flex-wrap gap-3 text-sm">
          {hasPassword && (
            <li className="flex items-center gap-2 rounded-full border px-3 py-1.5"><KeyRound className="size-4 text-primary" />{A.methodPassword}</li>
          )}
          {customer.authProviders.includes("google") && (
            <li className="flex items-center gap-2 rounded-full border px-3 py-1.5"><FcGoogle className="size-4" />{A.methodGoogle}</li>
          )}
        </ul>
      </section>
    </div>
  );
}
