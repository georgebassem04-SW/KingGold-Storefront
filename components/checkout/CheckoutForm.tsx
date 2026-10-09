/**
 * CHECKOUT (runs in the browser)
 * ------------------------------------------------------------------
 * One page, three steps + the order summary:
 *   1. Contact details   (name, mobile, email)
 *   2. Delivery          (home delivery -> area + address  |  store pickup -> branch)
 *   3. Payment           (only the methods allowed for this delivery choice and order total)
 *   + notes, terms checkbox, coupon (in the summary)
 *
 * Flow:
 *   - The total is always calculated on the server (useCheckoutQuote -> /api/checkout/quote)
 *   - "Place order" -> /api/checkout/order -> dashboard
 *       ok             -> cart is emptied, customer goes to the order success page
 *                         (or to the payment gateway for card payments)
 *       price_changed  -> the new total is shown and the customer confirms again
 *
 * Where to edit:
 *   - Texts (AR/EN)                           -> i18n/dictionaries/*.json -> "checkout"
 *   - Areas + fees, payment methods, VAT rule -> mock-data/checkout-options.json (later: the dashboard)
 *   - Field rules                             -> lib/validation/checkout.ts
 *   - Summary column                          -> OrderSummary.tsx
 */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Info, ShoppingBag, Store, Truck } from "lucide-react";
import type { Address, CheckoutOptions, Locale, LocalizedText, PlacedOrder } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { checkoutFormSchema, type CheckoutFormInput } from "@/lib/validation/checkout";
import { useCartStore } from "@/stores/cart-store";
import { localePath } from "@/i18n/config";
import { fill, formatPrice, t } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { OrderSummary } from "./OrderSummary";
import { useCheckoutQuote } from "./useCheckoutQuote";

export interface PickupBranch {
  id: string;
  name: LocalizedText;
  address: LocalizedText;
  hours: LocalizedText;
}

/** The logged-in customer (null for guests) */
export interface CheckoutCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addresses: Address[];
}

interface Props {
  customer: CheckoutCustomer | null;
  locale: Locale;
  labels: Dictionary["checkout"];
  productLabels: Dictionary["product"];
  options: CheckoutOptions;
  branches: PickupBranch[];
  storePickupEnabled: boolean;
  guestCheckout: boolean;
  currency: string;
}

const FORM_ID = "checkout-form";

export function CheckoutForm({ customer, locale, labels, productLabels, options, branches, storePickupEnabled, guestCheckout, currency }: Props) {
  const router = useRouter();
  const p = (path: string) => localePath(locale, path);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  // Cart is stored in the browser: wait for the page to load before reading it
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<"priceChanged" | "errorGeneric" | "invalidPayment" | null>(null);
  // One id per checkout attempt, so a double click never creates two orders
  const idempotencyKey = useRef<string>(crypto.randomUUID());

  const zones = options.shippingZones.filter((z) => z.isActive);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      // Logged-in customers start with their saved details and default address
      name: customer ? `${customer.firstName} ${customer.lastName}`.trim() : "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      deliveryMethod: "delivery",
      ...addressFields(customer?.addresses.find((a) => a.isDefault) ?? customer?.addresses[0]),
      pickupBranchId: "",
      paymentMethodId: "",
      notes: "",
      acceptTerms: false as unknown as true,
      saveAddress: true,
    },
  });

  // Saved address chosen at checkout ("new" = typing a new one)
  const [savedAddressId, setSavedAddressId] = useState<string>(
    () => (customer?.addresses.find((a) => a.isDefault) ?? customer?.addresses[0])?.id ?? "new",
  );
  const chooseSavedAddress = (id: string) => {
    setSavedAddressId(id);
    const fields = addressFields(customer?.addresses.find((a) => a.id === id));
    for (const [key, value] of Object.entries(fields)) setValue(key as keyof CheckoutFormInput, value, { shouldValidate: false });
  };

  const deliveryMethod = watch("deliveryMethod");
  const shippingZoneId = watch("shippingZoneId");
  const paymentMethodId = watch("paymentMethodId");

  const { quote, isFetching, notices, replaceQuote } = useCheckoutQuote({
    deliveryMethod,
    shippingZoneId: deliveryMethod === "delivery" ? shippingZoneId : undefined,
    couponCode: appliedCoupon,
    enabled: mounted,
  });

  // Payment methods allowed for this delivery choice and order total
  const payments = useMemo(
    () =>
      options.paymentMethods.filter(
        (m) =>
          m.isActive &&
          m.availableFor.includes(deliveryMethod) &&
          (m.maxOrderTotal === undefined || !quote || quote.total <= m.maxOrderTotal),
      ),
    [options.paymentMethods, deliveryMethod, quote],
  );

  // If the chosen payment is no longer allowed (e.g. switched to pickup), clear it
  useEffect(() => {
    if (paymentMethodId && !payments.some((m) => m.id === paymentMethodId)) setValue("paymentMethodId", "");
  }, [payments, paymentMethodId, setValue]);

  const errorText = (code?: string) =>
    code ? (labels.errors[code as keyof typeof labels.errors] ?? labels.errors.required) : undefined;

  // ===== PLACE ORDER =====
  async function onSubmit(values: CheckoutFormInput) {
    if (!quote) return;
    setSubmitError(null);
    try {
      const res = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { ...values, couponCode: appliedCoupon, saveAddress: !!customer && savedAddressId === "new" && values.saveAddress },
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          expectedTotal: quote.total,
          idempotencyKey: idempotencyKey.current,
          locale,
        }),
      });
      // The route answers a PlacedOrder, or a field-validation error
      type Answer = PlacedOrder | { ok: false; error: "validation" | "server" | "invalid_request"; errors?: Record<string, string> };
      const data = (await res.json()) as Answer;

      if (data.ok) {
        clearCart();
        if (data.paymentRedirectUrl) {
          window.location.href = data.paymentRedirectUrl; // card payment page
        } else {
          router.push(`${p("/order-success")}?order=${encodeURIComponent(data.orderNumber)}`);
        }
        return;
      }
      if (data.error === "validation" && "errors" in data && data.errors) {
        for (const [field, code] of Object.entries(data.errors)) setError(field as keyof CheckoutFormInput, { message: code });
        return;
      }
      if ("quote" in data && data.quote) replaceQuote(data.quote);
      // A new attempt after a problem gets a fresh id
      idempotencyKey.current = crypto.randomUUID();
      setSubmitError(data.error === "price_changed" ? "priceChanged" : data.error === "invalid_payment" ? "invalidPayment" : "errorGeneric");
    } catch {
      setSubmitError("errorGeneric");
    }
  }

  // ===== SPECIAL STATES =====
  if (!mounted) return <div className="h-96 animate-pulse rounded-xl bg-muted" />;

  if (!guestCheckout && !customer) {
    // Accounts aren't built yet; when they are, show the form to logged-in customers
    return (
      <EmptyState icon={<Info />} title={labels.loginRequired}>
        <Button asChild>
          <Link href={`${p("/login")}?returnTo=${encodeURIComponent(p("/checkout"))}`}>{labels.login}</Link>
        </Button>
      </EmptyState>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState icon={<ShoppingBag />} title={labels.emptyCart} text={labels.emptyCartText}>
        <Button asChild>
          <Link href={p("/products")}>{labels.backToShop}</Link>
        </Button>
      </EmptyState>
    );
  }

  const belowMinimum = quote?.blockers.includes("below_minimum");
  const zoneUnavailable = quote?.blockers.includes("zone_unavailable");
  const pickupUnavailable = quote?.blockers.includes("pickup_unavailable");
  const canSubmit = !!quote && quote.blockers.length === 0 && payments.length > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        {/* Notices: prices updated, items removed, price changed on submit */}
        {(notices.length > 0 || submitError || belowMinimum || zoneUnavailable || pickupUnavailable) && (
          <div className="space-y-2">
            {notices.map((n) => (
              <Notice key={n} tone="info">{labels[n]}</Notice>
            ))}
            {zoneUnavailable && <Notice tone="warning">{labels.zoneUnavailable}</Notice>}
            {pickupUnavailable && <Notice tone="warning">{labels.pickupUnavailable}</Notice>}
            {belowMinimum && options.minOrderTotal && (
              <Notice tone="warning">{fill(labels.belowMinimum, { amount: formatPrice(options.minOrderTotal, currency, locale) })}</Notice>
            )}
            {submitError && <Notice tone="warning">{labels[submitError]}</Notice>}
          </div>
        )}

        {/* ===== 1. CONTACT ===== */}
        <Section title={labels.contactTitle}>
          {customer ? (
            <p className="-mt-2 text-sm text-muted-foreground">{fill(labels.loggedInAs, { name: customer.firstName })}</p>
          ) : (
            <p className="-mt-2 text-sm text-muted-foreground">
              {labels.loginForFaster}{" "}
              <Link href={`${p("/login")}?returnTo=${encodeURIComponent(p("/checkout"))}`} className="font-medium text-primary hover:underline">
                {labels.loginLink}
              </Link>
            </p>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="name" label={labels.name} error={errorText(errors.name?.message)}>
              <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
            </Field>
            <Field id="phone" label={labels.phone} error={errorText(errors.phone?.message)}>
              <Input id="phone" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
            </Field>
          </div>
          <Field id="email" label={labels.email} hint={labels.emailHint} error={errorText(errors.email?.message)}>
            <Input id="email" type="email" dir="ltr" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
        </Section>

        {/* ===== 2. DELIVERY ===== */}
        <Section title={labels.deliveryTitle}>
          <div className={cn("grid gap-3", storePickupEnabled && "sm:grid-cols-2")}>
            <ChoiceCard
              selected={deliveryMethod === "delivery"}
              icon={<Truck />}
              title={labels.delivery}
              text={labels.deliveryHint}
              input={<input type="radio" value="delivery" className="sr-only" {...register("deliveryMethod")} />}
            />
            {storePickupEnabled && (
              <ChoiceCard
                selected={deliveryMethod === "store_pickup"}
                icon={<Store />}
                title={labels.pickup}
                text={labels.pickupHint}
                input={<input type="radio" value="store_pickup" className="sr-only" {...register("deliveryMethod")} />}
              />
            )}
          </div>

          {deliveryMethod === "delivery" && customer && customer.addresses.length > 0 && (
            <fieldset className="space-y-3">
              {customer.addresses.map((a) => (
                <ChoiceCard
                  key={a.id}
                  selected={savedAddressId === a.id}
                  title={a.label}
                  text={[a.street, a.building, a.area, a.city, t(zones.find((z) => z.id === a.shippingZoneId)?.name ?? { ar: "", en: "" }, locale)].filter(Boolean).join("، ")}
                  input={<input type="radio" name="savedAddress" className="sr-only" checked={savedAddressId === a.id} onChange={() => chooseSavedAddress(a.id)} />}
                />
              ))}
              <ChoiceCard
                selected={savedAddressId === "new"}
                title={labels.newAddress}
                input={<input type="radio" name="savedAddress" className="sr-only" checked={savedAddressId === "new"} onChange={() => chooseSavedAddress("new")} />}
              />
            </fieldset>
          )}

          {deliveryMethod === "delivery" ? (
            <div className={cn("space-y-5", customer && savedAddressId !== "new" && "hidden")}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field id="shippingZoneId" label={labels.governorate} error={errorText(errors.shippingZoneId?.message)}>
                  <NativeSelect id="shippingZoneId" aria-invalid={!!errors.shippingZoneId} {...register("shippingZoneId")}>
                    <option value="">{labels.chooseGovernorate}</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {t(z.name, locale)} — {z.fee === 0 ? labels.free : formatPrice(z.fee, currency, locale)} ({t(z.deliveryTime, locale)})
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field id="city" label={labels.city} error={errorText(errors.city?.message)}>
                  <Input id="city" autoComplete="address-level2" aria-invalid={!!errors.city} {...register("city")} />
                </Field>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field id="area" label={labels.areaField} error={errorText(errors.area?.message)}>
                  <Input id="area" autoComplete="address-level3" {...register("area")} />
                </Field>
                <Field id="building" label={labels.building} error={errorText(errors.building?.message)}>
                  <Input id="building" autoComplete="address-line2" {...register("building")} />
                </Field>
              </div>
              <Field id="street" label={labels.street} error={errorText(errors.street?.message)}>
                <Input id="street" autoComplete="address-line1" aria-invalid={!!errors.street} {...register("street")} />
              </Field>
              <Field id="addressNotes" label={labels.addressNotes} error={errorText(errors.addressNotes?.message)}>
                <Input id="addressNotes" {...register("addressNotes")} />
              </Field>
              {customer && (
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" className="size-4 accent-[var(--primary)]" {...register("saveAddress")} />
                  {labels.saveAddress}
                </label>
              )}
            </div>
          ) : (
            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium">{labels.chooseBranch}</legend>
              {branches.map((b) => (
                <ChoiceCard
                  key={b.id}
                  selected={watch("pickupBranchId") === b.id}
                  title={t(b.name, locale)}
                  text={`${t(b.address, locale)} · ${t(b.hours, locale)}`}
                  input={<input type="radio" value={b.id} className="sr-only" {...register("pickupBranchId")} />}
                />
              ))}
              {errors.pickupBranchId && <p className="text-sm text-destructive">{errorText(errors.pickupBranchId.message)}</p>}
            </fieldset>
          )}
        </Section>

        {/* ===== 3. PAYMENT ===== */}
        <Section title={labels.paymentTitle}>
          {payments.length === 0 ? (
            <Notice tone="warning">{labels.noPaymentMethods}</Notice>
          ) : (
            <div className="space-y-3">
              {payments.map((m) => (
                <ChoiceCard
                  key={m.id}
                  selected={paymentMethodId === m.id}
                  title={t(m.label, locale)}
                  text={m.description ? t(m.description, locale) : undefined}
                  input={<input type="radio" value={m.id} className="sr-only" {...register("paymentMethodId")} />}
                />
              ))}
            </div>
          )}
          {errors.paymentMethodId && <p className="text-sm text-destructive">{errorText(errors.paymentMethodId.message)}</p>}

          <Field id="notes" label={labels.notes} error={errorText(errors.notes?.message)}>
            <Textarea id="notes" rows={3} placeholder={labels.notesPlaceholder} className="min-h-20" {...register("notes")} />
          </Field>

          <div>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" {...register("acceptTerms")} />
              <span>
                {labels.acceptTerms}{" "}
                <Link href={p(options.termsUrl)} target="_blank" className="text-primary underline underline-offset-4">
                  {labels.termsLink}
                </Link>
              </span>
            </label>
            {errors.acceptTerms && <p className="mt-2 text-sm text-destructive">{errorText(errors.acceptTerms.message)}</p>}
          </div>
        </Section>

        <Link href={p("/cart")} className="inline-block text-sm text-muted-foreground hover:text-primary">
          ← {labels.backToCart}
        </Link>
      </form>

      <OrderSummary
        locale={locale}
        labels={labels}
        productLabels={productLabels}
        quote={quote}
        isUpdating={isFetching}
        options={options}
        deliveryMethod={deliveryMethod}
        hasZone={!!shippingZoneId}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={setAppliedCoupon}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit && !isFetching}
        formId={FORM_ID}
      />
    </div>
  );
}

/** Address -> the checkout form's address fields (empty when there is no address) */
function addressFields(a?: Address) {
  return {
    shippingZoneId: a?.shippingZoneId ?? "",
    city: a?.city ?? "",
    area: a?.area ?? "",
    street: a?.street ?? "",
    building: a?.building ?? "",
    addressNotes: a?.notes ?? "",
  };
}

/* ---------- small building blocks ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-xl border p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** A selectable card (radio button styled as a box) */
function ChoiceCard({ selected, icon, title, text, input }: { selected: boolean; icon?: React.ReactNode; title: string; text?: string; input: React.ReactNode }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/60",
      )}
    >
      {input}
      <span
        aria-hidden
        className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary" : "border-muted-foreground/40")}
      >
        {selected && <span className="size-2 rounded-full bg-primary" />}
      </span>
      {icon && <span className="text-primary [&_svg]:size-5">{icon}</span>}
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        {text && <span className="mt-0.5 block text-sm text-muted-foreground">{text}</span>}
      </span>
    </label>
  );
}

function Notice({ tone, children }: { tone: "info" | "warning"; children: React.ReactNode }) {
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-lg p-3 text-sm",
        tone === "info" ? "bg-sky-50 text-sky-800" : "bg-amber-50 text-amber-900",
      )}
    >
      {tone === "info" ? <Info className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}

function EmptyState({ icon, title, text, children }: { icon: React.ReactNode; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border py-16 text-center">
      <span className="mb-4 text-muted-foreground [&_svg]:size-12">{icon}</span>
      <h2 className="text-xl font-semibold">{title}</h2>
      {text && <p className="mt-2 text-muted-foreground">{text}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}
