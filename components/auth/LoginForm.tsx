/**
 * LOG IN FORM (browser) — email + password, plus "Continue with Google".
 * On success the session cookie is set by /api/auth/login and the customer goes to `returnTo`.
 * Texts: i18n/dictionaries/*.json -> "auth"
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { loginSchema, type LoginInput } from "@/lib/validation/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/Field";
import { FormAlert } from "@/components/forms/FormAlert";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { GoogleButton, OrDivider } from "./GoogleButton";

type Messages = Dictionary["auth"]["messages"];

export function LoginForm({ locale, labels, returnTo, initialError }: { locale: Locale; labels: Dictionary["auth"]; returnTo: string; initialError?: string }) {
  const [message, setMessage] = useState<string | undefined>(initialError);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const err = (code?: string) => (code ? (labels.errors[code as keyof typeof labels.errors] ?? labels.errors.required) : undefined);

  async function onSubmit(values: LoginInput) {
    setMessage(undefined);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const data = await res.json().catch(() => ({ ok: false, error: "server" }));
    if (data.ok) {
      // Full page load so the header and every page see the new session
      window.location.assign(returnTo);
      return;
    }
    setMessage(data.error ?? "server");
  }

  return (
    <div className="space-y-6">
      {message && <FormAlert tone="error">{labels.messages[message as keyof Messages] ?? labels.messages.server}</FormAlert>}

      <GoogleButton locale={locale} returnTo={returnTo} label={labels.google} />
      <OrDivider label={labels.or} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field id="email" label={labels.email} error={err(errors.email?.message)}>
          <Input id="email" type="email" dir="ltr" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field id="password" label={labels.password} error={err(errors.password?.message)}>
          <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} showLabel={labels.showPassword} hideLabel={labels.hidePassword} {...register("password")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? labels.loggingIn : labels.login}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {labels.noAccount}{" "}
        <Link href={`/${locale}/register?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-primary hover:underline">
          {labels.createOne}
        </Link>
      </p>
    </div>
  );
}
