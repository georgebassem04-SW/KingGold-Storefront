/**
 * CONTACT FORM (runs in the browser)
 * ------------------------------------------------------------------
 * Built with React Hook Form + Zod. Rules are in lib/validation/contact.ts.
 * On submit it POSTs to /api/contact, which forwards the message to the dashboard.
 *
 * Where to edit:
 *   - Field labels / error texts (AR/EN) -> i18n/dictionaries/*.json -> "contact"
 *   - Subject options, success message    -> the page JSON (block "contact"), later the dashboard
 *   - Add a field: add it to the schema in lib/validation/contact.ts, then add an input below
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { Locale } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { contactSchema, type ContactFormInput } from "@/lib/validation/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  locale: Locale;
  labels: Dictionary["contact"];
  subjects: { value: string; label: string }[];
  branches: { id: string; name: string }[];
  successMessage: string;
}

type Status = { kind: "idle" } | { kind: "sent"; reference?: string } | { kind: "error" };

export function ContactForm({ locale, labels, subjects, branches, successMessage }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phone: "", email: "", subject: "", branchId: "", preferredChannel: "whatsapp", message: "", website: "" },
  });

  // Turns an error code ("invalidPhone") into text in the current language
  const errorText = (code?: string) =>
    code ? (labels.errors[code as keyof typeof labels.errors] ?? labels.errors.required) : undefined;

  async function onSubmit(values: ContactFormInput) {
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus({ kind: "sent", reference: data.reference });
        reset();
        return;
      }
      // The server found a problem in a field: show it under that field
      if (data.errors) {
        for (const [field, code] of Object.entries(data.errors as Record<string, string>)) {
          setError(field as keyof ContactFormInput, { message: code });
        }
        return;
      }
      setStatus({ kind: "error" });
    } catch {
      setStatus({ kind: "error" });
    }
  }

  // ===== SUCCESS SCREEN =====
  if (status.kind === "sent") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-secondary/40 p-10 text-center" role="status">
        <CheckCircle2 className="mb-4 size-12 text-primary" />
        <p className="text-lg font-medium">{successMessage}</p>
        {status.reference && (
          <p className="mt-2 text-sm text-muted-foreground">
            {labels.referenceLabel}: <span dir="ltr">{status.reference}</span>
          </p>
        )}
        <Button variant="outline" className="mt-6" onClick={() => setStatus({ kind: "idle" })}>
          {labels.sendAnother}
        </Button>
      </div>
    );
  }

  const channel = watch("preferredChannel");

  // ===== FORM =====
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-xl border p-6 md:p-8">
      {/* Anti-spam: hidden from people, bots fill it in */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...register("website")} />

      <div className="grid gap-5 md:grid-cols-2">
        <Field id="name" label={labels.name} error={errorText(errors.name?.message)}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>

        <Field id="phone" label={labels.phone} error={errorText(errors.phone?.message)}>
          {/* dir="ltr" so "+20 100..." types left-to-right even on the Arabic page */}
          <Input id="phone" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
      </div>

      <Field id="email" label={labels.email} error={errorText(errors.email?.message)}>
        <Input id="email" type="email" dir="ltr" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>

      <div className={cn("grid gap-5", branches.length > 0 && "md:grid-cols-2")}>
        <Field id="subject" label={labels.subject} error={errorText(errors.subject?.message)}>
          <NativeSelect id="subject" aria-invalid={!!errors.subject} {...register("subject")}>
            <option value="">{labels.chooseSubject}</option>
            {subjects.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
        </Field>

        {/* Only shown when the block has showBranchSelect: true */}
        {branches.length > 0 && (
          <Field id="branchId" label={labels.branch}>
            <NativeSelect id="branchId" {...register("branchId")}>
              <option value="">{labels.anyBranch}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}
      </div>

      {/* Preferred reply channel: three pill buttons */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{labels.preferredChannel}</legend>
        <div className="flex flex-wrap gap-2">
          {(["whatsapp", "phone", "email"] as const).map((c) => (
            <label
              key={c}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors",
                channel === c ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary",
              )}
            >
              <input type="radio" value={c} className="sr-only" {...register("preferredChannel")} />
              {labels.channels[c]}
            </label>
          ))}
        </div>
      </fieldset>

      <Field id="message" label={labels.message} error={errorText(errors.message?.message)}>
        <Textarea id="message" rows={5} placeholder={labels.messagePlaceholder} aria-invalid={!!errors.message} {...register("message")} />
      </Field>

      {status.kind === "error" && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {labels.errorGeneric}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? labels.sending : labels.send}
      </Button>
    </form>
  );
}

/** Label + field + error line, reused by every input */
function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
