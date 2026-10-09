/**
 * CHANGE / SET PASSWORD (browser). Customers who joined with Google set a first password
 * (no "current password" field). Saves with POST /api/account/password.
 */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { passwordChangeSchema, type PasswordChangeInput } from "@/lib/validation/account";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/Field";
import { FormAlert } from "@/components/forms/FormAlert";
import { PasswordInput } from "@/components/forms/PasswordInput";

export function PasswordForm({ hasPassword, labels, authLabels }: { hasPassword: boolean; labels: Dictionary["account"]; authLabels: Dictionary["auth"] }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const err = (code?: string) => (code ? (authLabels.errors[code as keyof typeof authLabels.errors] ?? authLabels.errors.required) : undefined);
  const pw = { showLabel: authLabels.showPassword, hideLabel: authLabels.hidePassword };

  async function onSubmit(values: PasswordChangeInput) {
    setSaved(false);
    if (hasPassword && !values.currentPassword) {
      setError("currentPassword", { message: "required" });
      return;
    }
    const res = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const data = await res.json().catch(() => ({ ok: false }));
    if (data.ok) {
      setSaved(true);
      reset();
      router.refresh();
      return;
    }
    if (data.errors) for (const [f, c] of Object.entries(data.errors as Record<string, string>)) setError(f as keyof PasswordChangeInput, { message: c });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {saved && <FormAlert tone="success">{labels.passwordSaved}</FormAlert>}
      {hasPassword && (
        <Field id="currentPassword" label={labels.currentPassword} error={err(errors.currentPassword?.message)}>
          <PasswordInput id="currentPassword" autoComplete="current-password" aria-invalid={!!errors.currentPassword} {...pw} {...register("currentPassword")} />
        </Field>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="newPassword" label={labels.newPassword} hint={authLabels.passwordHint} error={err(errors.newPassword?.message)}>
          <PasswordInput id="newPassword" autoComplete="new-password" aria-invalid={!!errors.newPassword} {...pw} {...register("newPassword")} />
        </Field>
        <Field id="confirmPassword" label={authLabels.confirmPassword} error={err(errors.confirmPassword?.message)}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...pw} {...register("confirmPassword")} />
        </Field>
      </div>
      <Button type="submit" variant="outline" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {labels.changePassword}
      </Button>
    </form>
  );
}
