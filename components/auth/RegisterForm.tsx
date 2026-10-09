/**
 * SIGN UP FORM (browser) — name, email, mobile, password (+ confirm), or "Continue with Google".
 * /api/auth/register creates the customer and logs them in straight away.
 * Texts: i18n/dictionaries/*.json -> "auth". Rules: lib/validation/account.ts
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { registerSchema, type RegisterInput } from "@/lib/validation/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/Field";
import { FormAlert } from "@/components/forms/FormAlert";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { GoogleButton, OrDivider } from "./GoogleButton";

export function RegisterForm({ locale, labels, returnTo, termsHref }: { locale: Locale; labels: Dictionary["auth"]; returnTo: string; termsHref: string }) {
  const [message, setMessage] = useState<string>();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });
  const err = (code?: string) => (code ? (labels.errors[code as keyof typeof labels.errors] ?? labels.errors.required) : undefined);
  const pw = { showLabel: labels.showPassword, hideLabel: labels.hidePassword };

  async function onSubmit(values: RegisterInput) {
    setMessage(undefined);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const data = await res.json().catch(() => ({ ok: false, error: "server" }));
    if (data.ok) {
      window.location.assign(returnTo);
      return;
    }
    if (data.errors) {
      for (const [field, code] of Object.entries(data.errors as Record<string, string>)) setError(field as keyof RegisterInput, { message: code });
    }
    if (data.error !== "validation" && !data.errors) setMessage(data.error);
  }

  return (
    <div className="space-y-6">
      {message && <FormAlert tone="error">{labels.messages[message as keyof typeof labels.messages] ?? labels.messages.server}</FormAlert>}

      <GoogleButton locale={locale} returnTo={returnTo} label={labels.google} />
      <OrDivider label={labels.or} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="firstName" label={labels.firstName} error={err(errors.firstName?.message)}>
            <Input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} {...register("firstName")} />
          </Field>
          <Field id="lastName" label={labels.lastName} error={err(errors.lastName?.message)}>
            <Input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} {...register("lastName")} />
          </Field>
        </div>
        <Field id="email" label={labels.email} error={err(errors.email?.message)}>
          <Input id="email" type="email" dir="ltr" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field id="phone" label={labels.phone} error={err(errors.phone?.message)}>
          <Input id="phone" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
        <Field id="password" label={labels.password} hint={labels.passwordHint} error={err(errors.password?.message)}>
          <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...pw} {...register("password")} />
        </Field>
        <Field id="confirmPassword" label={labels.confirmPassword} error={err(errors.confirmPassword?.message)}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...pw} {...register("confirmPassword")} />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? labels.registering : labels.register}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {labels.termsNote}{" "}
          <Link href={termsHref} className="underline underline-offset-4">{labels.terms}</Link>
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {labels.haveAccount}{" "}
        <Link href={`/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-primary hover:underline">
          {labels.loginLink}
        </Link>
      </p>
    </div>
  );
}
