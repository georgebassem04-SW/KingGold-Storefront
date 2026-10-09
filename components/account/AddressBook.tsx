/**
 * ADDRESS BOOK (browser) — list of saved addresses with Add / Edit / Delete / Set as default.
 * ------------------------------------------------------------------
 * Saves through /api/account/addresses (POST) and /api/account/addresses/<id> (PUT, DELETE).
 * The area list (governorates) and their delivery fees come from the checkout options (dashboard),
 * so a saved address always matches a delivery zone at checkout.
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Address, Customer, Locale, ShippingZone } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { addressSchema, type AddressFormInput } from "@/lib/validation/account";
import { t } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/forms/Field";

interface Props {
  locale: Locale;
  initial: Address[];
  zones: ShippingZone[];
  defaults: { fullName: string; phone: string };
  labels: Dictionary["account"];
  authLabels: Dictionary["auth"];
  checkoutLabels: Dictionary["checkout"];
}

type Mode = { kind: "list" } | { kind: "add" } | { kind: "edit"; address: Address };

const toForm = (a: Address): AddressFormInput => ({
  label: a.label,
  fullName: a.fullName,
  phone: a.phone,
  shippingZoneId: a.shippingZoneId ?? "",
  city: a.city,
  area: a.area ?? "",
  street: a.street,
  building: a.building ?? "",
  notes: a.notes ?? "",
  isDefault: a.isDefault,
});

export function AddressBook({ locale, initial, zones, defaults, labels, authLabels, checkoutLabels }: Props) {
  const [addresses, setAddresses] = useState(initial);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const zoneName = (id?: string) => {
    const z = zones.find((x) => x.id === id);
    return z ? t(z.name, locale) : "";
  };

  async function call(url: string, method: string, body?: unknown) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    return res.json().catch(() => ({ ok: false })) as Promise<{ ok: boolean; customer?: Customer; errors?: Record<string, string> }>;
  }

  async function remove(a: Address) {
    if (!window.confirm(labels.confirmDelete)) return;
    setBusyId(a.id);
    const data = await call(`/api/account/addresses/${a.id}`, "DELETE");
    if (data.ok && data.customer) setAddresses(data.customer.addresses);
    setBusyId(null);
  }

  async function makeDefault(a: Address) {
    setBusyId(a.id);
    const data = await call(`/api/account/addresses/${a.id}`, "PUT", { ...toForm(a), isDefault: true });
    if (data.ok && data.customer) setAddresses(data.customer.addresses);
    setBusyId(null);
  }

  if (mode.kind !== "list") {
    return (
      <AddressForm
        title={mode.kind === "add" ? labels.addAddress : labels.editAddress}
        initial={
          mode.kind === "edit"
            ? toForm(mode.address)
            : { label: "", fullName: defaults.fullName, phone: defaults.phone, shippingZoneId: "", city: "", area: "", street: "", building: "", notes: "", isDefault: addresses.length === 0 }
        }
        zones={zones}
        locale={locale}
        labels={labels}
        authLabels={authLabels}
        checkoutLabels={checkoutLabels}
        onCancel={() => setMode({ kind: "list" })}
        onSubmit={async (values) => {
          const data =
            mode.kind === "add"
              ? await call("/api/account/addresses", "POST", values)
              : await call(`/api/account/addresses/${mode.address.id}`, "PUT", values);
          if (data.ok && data.customer) {
            setAddresses(data.customer.addresses);
            setMode({ kind: "list" });
          }
          return data.errors;
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <article key={a.id} className="flex flex-col rounded-xl border p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-semibold">
                <MapPin className="size-4 text-primary" />
                {a.label}
              </h3>
              {a.isDefault && <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">{labels.default}</span>}
            </div>
            <p className="text-sm">{a.fullName} · <span dir="ltr">{a.phone}</span></p>
            <p className="mt-1 text-sm text-muted-foreground">
              {[a.street, a.building, a.area, a.city, zoneName(a.shippingZoneId)].filter(Boolean).join("، ")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              <Button size="sm" variant="outline" onClick={() => setMode({ kind: "edit", address: a })}>
                <Pencil /> {labels.edit}
              </Button>
              {!a.isDefault && (
                <Button size="sm" variant="ghost" onClick={() => makeDefault(a)} disabled={busyId === a.id}>
                  <Star /> {labels.setDefault}
                </Button>
              )}
              <Button size="sm" variant="ghost" className="ms-auto text-muted-foreground hover:text-destructive" onClick={() => remove(a)} disabled={busyId === a.id}>
                {busyId === a.id ? <Loader2 className="animate-spin" /> : <Trash2 />} {labels.delete}
              </Button>
            </div>
          </article>
        ))}

        {/* Add new */}
        <button
          type="button"
          onClick={() => setMode({ kind: "add" })}
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-6" />
          {labels.addAddress}
        </button>
      </div>
    </div>
  );
}

/* ---------- the add / edit form ---------- */
function AddressForm({
  title, initial, zones, locale, labels, authLabels, checkoutLabels, onCancel, onSubmit,
}: {
  title: string;
  initial: AddressFormInput;
  zones: ShippingZone[];
  locale: Locale;
  labels: Dictionary["account"];
  authLabels: Dictionary["auth"];
  checkoutLabels: Dictionary["checkout"];
  onCancel: () => void;
  onSubmit: (values: AddressFormInput) => Promise<Record<string, string> | undefined>;
}) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<AddressFormInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial,
  });
  const err = (code?: string) => (code ? (authLabels.errors[code as keyof typeof authLabels.errors] ?? authLabels.errors.required) : undefined);

  return (
    <form
      noValidate
      className="space-y-5 rounded-xl border p-6"
      onSubmit={handleSubmit(async (values) => {
        const serverErrors = await onSubmit(values);
        if (serverErrors) for (const [f, c] of Object.entries(serverErrors)) setError(f as keyof AddressFormInput, { message: c });
      })}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="label" label={labels.label} error={err(errors.label?.message)}>
          <Input id="label" placeholder={labels.labelPlaceholder} aria-invalid={!!errors.label} {...register("label")} />
        </Field>
        <Field id="fullName" label={labels.fullName} error={err(errors.fullName?.message)}>
          <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...register("fullName")} />
        </Field>
        <Field id="phone" label={authLabels.phone} error={err(errors.phone?.message)}>
          <Input id="phone" type="tel" dir="ltr" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="shippingZoneId" label={checkoutLabels.governorate} error={err(errors.shippingZoneId?.message)}>
          <NativeSelect id="shippingZoneId" aria-invalid={!!errors.shippingZoneId} {...register("shippingZoneId")}>
            <option value="">{checkoutLabels.chooseGovernorate}</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{t(z.name, locale)}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="city" label={checkoutLabels.city} error={err(errors.city?.message)}>
          <Input id="city" autoComplete="address-level2" aria-invalid={!!errors.city} {...register("city")} />
        </Field>
        <Field id="area" label={checkoutLabels.areaField} error={err(errors.area?.message)}>
          <Input id="area" {...register("area")} />
        </Field>
        <Field id="building" label={checkoutLabels.building} error={err(errors.building?.message)}>
          <Input id="building" {...register("building")} />
        </Field>
      </div>
      <Field id="street" label={checkoutLabels.street} error={err(errors.street?.message)}>
        <Input id="street" autoComplete="address-line1" aria-invalid={!!errors.street} {...register("street")} />
      </Field>
      <Field id="notes" label={checkoutLabels.addressNotes} error={err(errors.notes?.message)}>
        <Input id="notes" {...register("notes")} />
      </Field>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="size-4 accent-[var(--primary)]" {...register("isDefault")} />
        {labels.makeDefault}
      </label>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {labels.save}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>{labels.cancel}</Button>
      </div>
    </form>
  );
}
