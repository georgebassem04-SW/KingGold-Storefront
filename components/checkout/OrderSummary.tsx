/**
 * ORDER SUMMARY (right column of checkout) — items, coupon, subtotal, discount, shipping, VAT, total,
 * price-lock countdown and the "Place order" button.
 * All numbers come from the quote (the server), never from the browser.
 */
"use client";

import Image from "next/image";
import { useState } from "react";
import { Loader2, ShieldCheck, Tag, X } from "lucide-react";
import type { CheckoutOptions, Locale, Quote } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { fill, formatPrice, formatWeight, t } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PriceLockTimer } from "./PriceLockTimer";

interface Props {
  locale: Locale;
  labels: Dictionary["checkout"];
  productLabels: Dictionary["product"];
  quote?: Quote;
  isUpdating: boolean;
  options: CheckoutOptions;
  deliveryMethod: "delivery" | "store_pickup";
  hasZone: boolean;
  appliedCoupon?: string;
  onApplyCoupon: (code: string | undefined) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  formId: string;
}

export function OrderSummary(props: Props) {
  const { locale, labels, productLabels, quote, isUpdating, options, deliveryMethod, hasZone, appliedCoupon, onApplyCoupon, isSubmitting, canSubmit, formId } = props;
  const [code, setCode] = useState(appliedCoupon ?? "");
  const price = (n: number) => formatPrice(n, quote?.currency ?? "EGP", locale);

  const vatLabel = fill(options.vatBase === "making_charge" ? labels.vatOnMaking : labels.vat, { percent: options.vatPercent });
  const couponInvalid = quote?.coupon && !quote.coupon.valid;

  return (
    <aside className="h-fit space-y-5 rounded-xl border bg-secondary/40 p-6 lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold">{labels.summaryTitle}</h2>

      {/* ===== ITEMS ===== */}
      <ul className="space-y-4">
        {quote?.lines.map((l) => (
          <li key={l.variantId} className="flex gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
              {l.imageUrl && <Image src={l.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
              <span className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] text-background">
                {l.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="line-clamp-1 font-medium">{t(l.name, locale)}</p>
              <p className="text-muted-foreground">
                {l.karat}K · {formatWeight(l.weightGrams, locale)} {productLabels.grams}
                {l.size && <> · {l.size}</>}
              </p>
              {l.offerLabel && <p className="text-xs font-medium text-destructive">{t(l.offerLabel, locale)}</p>}
            </div>
            <p className="flex shrink-0 flex-col items-end text-sm font-medium">
              {price(l.lineTotal)}
              {/* Special offer: the price before it, crossed out */}
              {l.originalUnitPrice !== undefined && <s className="text-xs font-normal text-muted-foreground">{price(l.originalUnitPrice * l.quantity)}</s>}
            </p>
          </li>
        ))}
      </ul>

      {/* ===== COUPON ===== */}
      <div className="border-t pt-4">
        {appliedCoupon && quote?.coupon?.valid ? (
          <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <Tag className="size-4 text-primary" />
              <strong dir="ltr">{quote.coupon.code}</strong>
              {quote.coupon.label && <span className="text-muted-foreground">— {t(quote.coupon.label, locale)}</span>}
            </span>
            <button type="button" onClick={() => { setCode(""); onApplyCoupon(undefined); }} aria-label={labels.remove}>
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={labels.coupon}
              dir="ltr"
              className="bg-background uppercase"
              aria-invalid={!!couponInvalid}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onApplyCoupon(code.trim() || undefined);
                }
              }}
            />
            <Button type="button" variant="outline" onClick={() => onApplyCoupon(code.trim() || undefined)} disabled={!code.trim()}>
              {labels.apply}
            </Button>
          </div>
        )}
        {couponInvalid && (
          <p className="mt-2 text-sm text-destructive">
            {/* The exact reason when the dashboard sends one (expired, used up, minimum not reached…) */}
            {quote?.coupon?.reason && quote.coupon.reason !== "not_found"
              ? fill(labels.couponReasons[quote.coupon.reason], { amount: quote.coupon.minSubtotal !== undefined ? price(quote.coupon.minSubtotal) : "" })
              : labels.couponInvalid}
          </p>
        )}
      </div>

      {/* ===== TOTALS ===== */}
      <dl className={cn("space-y-2 border-t pt-4 text-sm transition-opacity", isUpdating && "opacity-60")}>
        <Row label={labels.subtotal} value={quote ? price(quote.subtotal) : "—"} />
        {!!quote?.discount && <Row label={labels.discount} value={`− ${price(quote.discount)}`} className="text-emerald-700" />}
        <Row
          label={labels.shipping}
          value={
            deliveryMethod === "store_pickup"
              ? labels.free
              : !hasZone
                ? labels.chooseAreaFirst
                : quote && quote.shipping === 0
                  ? labels.free
                  : quote
                    ? price(quote.shipping)
                    : "—"
          }
        />
        {options.vatBase !== "none" && <Row label={vatLabel} value={quote ? price(quote.vat) : "—"} />}
        <div className="flex items-center justify-between border-t pt-3 text-base font-bold">
          <dt>{labels.total}</dt>
          <dd className="flex items-center gap-2 text-primary">
            {isUpdating && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            {quote ? price(quote.total) : "—"}
          </dd>
        </div>
      </dl>

      {quote && <PriceLockTimer validUntil={quote.validUntil} lockedLabel={labels.priceLocked} expiredLabel={labels.priceExpired} />}

      {/* The button lives here but submits the form on the left (form attribute) */}
      <Button type="submit" form={formId} size="lg" className="w-full" disabled={!canSubmit || isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? labels.placing : labels.placeOrder}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        {labels.secure}
      </p>
    </aside>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between gap-4", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
