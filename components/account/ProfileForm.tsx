/**
 * EDIT ACCOUNT DETAILS (browser) — first/last name, email, mobile, birthday, offers opt-in.
 * Saves with PATCH /api/account/profile. Rules: lib/validation/account.ts -> profileSchema
 */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { Customer } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { profileSchema, type ProfileFormInput } from "@/lib/validation/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/Field";
import { FormAlert } from "@/components/forms/FormAlert";

export function ProfileForm({ customer, labels, authLabels }: { customer: Customer; labels: Dictionary["account"]; authLabels: Dictionary["auth"] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting, isDirty }, reset } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      birthDate: customer.birthDate ?? "",
      marketingOptIn: customer.marketingOptIn,
    },
  });
  const err = (code?: string) => (code ? (authLabels.errors[code as keyof typeof authLabels.errors] ?? authLabels.errors.required) : undefined);

  async function onSubmit(values: ProfileFormInput) {
    setStatus(null);
    const res = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const data = await res.json().catch(() => ({ ok: false }));
    if (data.ok) {
      setStatus("saved");
      reset(values); // the saved values become the new starting point
      router.refresh(); // update names shown elsewhere on the page
      return;
    }
    if (data.errors) for (const [f, c] of Object.entries(data.errors as Record<string, string>)) setError(f as keyof ProfileFormInput, { message: c });
    else setStatus("error");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {status === "saved" && <FormAlert tone="success">{labels.saved}</FormAlert>}
      {status === "error" && <FormAlert tone="error">{authLabels.messages.server}</FormAlert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="firstName" label={authLabels.firstName} error={err(errors.firstName?.message)}>
          <Input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} {...register("firstName")} />
        </Field>
        <Field id="lastName" label={authLabels.lastName} error={err(errors.lastName?.message)}>
          <Input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} {...register("lastName")} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="email" label={authLabels.email} error={err(errors.email?.message)}>
          <Input id="email" type="email" dir="ltr" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field id="phone" label={authLabels.phone} error={err(errors.phone?.message)}>
          <Input id="phone" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
      </div>
      <Field id="birthDate" label={labels.birthDate} hint={labels.birthDateHint} error={err(errors.birthDate?.message)}>
        <Input id="birthDate" type="date" className="max-w-xs" {...register("birthDate")} />
      </Field>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" {...register("marketingOptIn")} />
        {labels.marketing}
      </label>

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? labels.saving : labels.save}
      </Button>
    </form>
  );
}
