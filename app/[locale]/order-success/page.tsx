/**
 * PAGE: /[locale]/order-success?order=ORD-123456 — ORDER PLACED
 * ------------------------------------------------------------------
 * Shown right after checkout. Loads the order from the dashboard (GET /storefront/orders/<number>)
 * and shows: order number, items, totals, delivery/pickup details, payment instructions
 * (e.g. bank transfer details) and "what happens next".
 *
 * Where to edit:
 *   - Texts (AR/EN)             -> i18n/dictionaries/*.json -> "orderSuccess"
 *   - Bank transfer details     -> mock-data/checkout-options.json -> paymentMethods -> instructions
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Landmark } from "lucide-react";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { getDictionary } from "@/i18n/get-dictionary";
import { localePath } from "@/i18n/config";
import { formatDate, formatPrice, formatWeight, t } from "@/lib/format";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/[locale]/order-success">): Promise<Metadata> {
  const dict = await getDictionary((await params).locale as Locale);
  return { title: dict.pages.orderSuccess, robots: { index: false } };
}

export default async function OrderSuccessPage({ params, searchParams }: PageProps<"/[locale]/order-success">) {
  const locale = (await params).locale as Locale;
  const raw = (await searchParams).order;
  const number = typeof raw === "string" ? raw : undefined;

  const [dict, order, options, branches] = await Promise.all([
    getDictionary(locale),
    number ? api.getOrder(number) : Promise.resolve(null),
    api.getCheckoutOptions(),
    api.getBranches(),
  ]);
  const L = dict.orderSuccess;
  const p = (path: string) => localePath(locale, path);

  // ===== HEADER (shown even if the order can't be loaded) =====
  const header = (
    <div className="text-center">
      <CheckCircle2 className="mx-auto mb-4 size-16 text-primary" />
      <h1 className="text-3xl font-bold">{L.title}</h1>
      <p className="mt-2 text-muted-foreground">{L.subtitle}</p>
      {number && (
        <p className="mt-4 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm">
          {L.orderNumber}: <strong dir="ltr">{number}</strong>
        </p>
      )}
    </div>
  );

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        {header}
        <p className="mt-8 text-center text-sm text-muted-foreground">{L.notFound}</p>
        <div className="mt-8 flex justify-center">
          <Button asChild><Link href={p("/products")}>{L.continue}</Link></Button>
        </div>
      </div>
    );
  }

  const price = (n: number) => formatPrice(n, order.currency, locale);
  const payment = options.paymentMethods.find((m) => m.id === order.paymentMethodId);
  const branch = branches.find((b) => b.id === order.pickupBranchId);
  const isPickup = order.deliveryMethod === "store_pickup";

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {header}

      {/* ===== BANK TRANSFER / PAYMENT INSTRUCTIONS ===== */}
      {payment?.instructions && (
        <div className="mt-8 flex gap-3 rounded-xl border border-primary/40 bg-primary/5 p-5 text-sm">
          <Landmark className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">{L.bankInstructions}</p>
            <p className="mt-1 leading-relaxed">{t(payment.instructions, locale)}</p>
          </div>
        </div>
      )}

      {/* ===== ORDER DETAILS ===== */}
      <div className="mt-8 rounded-xl border">
        <dl className="grid gap-4 border-b p-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">{L.date}</dt>
            <dd className="mt-1 font-medium">{formatDate(order.createdAt, locale)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{L.paymentMethod}</dt>
            <dd className="mt-1 font-medium">{payment ? t(payment.label, locale) : order.paymentMethod}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{isPickup ? L.pickupFrom : L.deliveryTo}</dt>
            <dd className="mt-1 font-medium">
              {isPickup
                ? branch ? t(branch.name, locale) : "—"
                : order.shippingAddress
                  ? [order.shippingAddress.street, order.shippingAddress.area, order.shippingAddress.city].filter(Boolean).join("، ")
                  : "—"}
            </dd>
          </div>
        </dl>

        <ul className="divide-y">
          {order.lines.map((l) => (
            <li key={l.variantId} className="flex items-center gap-4 p-5">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {l.imageUrl && <Image src={l.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{t(l.name, locale)}</p>
                <p className="text-muted-foreground">
                  {l.karat}K · {formatWeight(l.weightGrams, locale)} {dict.product.grams}
                  {l.size && <> · {l.size}</>} · {L.quantity}: {l.quantity}
                </p>
              </div>
              <p className="text-sm font-medium">{price(l.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t p-5 text-sm">
          <Row label={dict.checkout.subtotal} value={price(order.subtotal)} />
          {order.discount > 0 && <Row label={`${dict.checkout.discount}${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`− ${price(order.discount)}`} />}
          <Row label={dict.checkout.shipping} value={order.shipping === 0 ? dict.checkout.free : price(order.shipping)} />
          {order.vat > 0 && <Row label={dict.checkout.vat.replace("{percent}", String(options.vatPercent))} value={price(order.vat)} />}
          <div className="flex justify-between border-t pt-3 text-base font-bold">
            <dt>{L.total}</dt>
            <dd className="text-primary">{price(order.total)}</dd>
          </div>
        </dl>
      </div>

      {/* ===== WHAT HAPPENS NEXT ===== */}
      <div className="mt-8 rounded-xl bg-secondary p-6">
        <h2 className="mb-4 font-semibold">{L.nextTitle}</h2>
        <ol className="space-y-3 text-sm">
          {[L.next1, L.next2, isPickup ? L.next3Pickup : L.next3Delivery].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{i + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild><Link href={p("/products")}>{L.continue}</Link></Button>
        <Button asChild variant="outline"><Link href={p("/contact")}>{L.contactUs}</Link></Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
