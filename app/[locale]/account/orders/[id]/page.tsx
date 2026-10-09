/**
 * PAGE: /[locale]/account/orders/<order number> — ONE ORDER
 * Items, totals, delivery/pickup, payment, and the status timeline (received -> confirmed -> …).
 * Only the logged-in customer's own orders can be opened; anything else shows "not found".
 * Status names: i18n/dictionaries/*.json -> "orderStatus"
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import { getDictionary } from "@/i18n/get-dictionary";
import { fill, formatDate, formatPrice, formatWeight, t } from "@/lib/format";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/orders/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const dict = await getDictionary(locale as Locale);
  return { title: fill(dict.account.orderTitle, { number: decodeURIComponent(id) }), robots: { index: false } };
}

export default async function OrderDetailsPage({ params }: PageProps<"/[locale]/account/orders/[id]">) {
  const { locale: l, id } = await params;
  const locale = l as Locale;
  const number = decodeURIComponent(id);
  const session = await requireSession(locale, `/${locale}/account/orders/${id}`);
  const [dict, order, options, branches] = await Promise.all([
    getDictionary(locale),
    api.getCustomerOrder(session, number),
    api.getCheckoutOptions(),
    api.getBranches(),
  ]);
  if (!order) notFound();

  const A = dict.account;
  const C = dict.checkout;
  const price = (n: number) => formatPrice(n, order.currency, locale);
  const payment = options.paymentMethods.find((m) => m.id === order.paymentMethodId);
  const branch = branches.find((b) => b.id === order.pickupBranchId);
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  const a = order.shippingAddress;

  return (
    <div className="space-y-8">
      <Link href={`/${locale}/account/orders`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <Back className="size-4" /> {A.backToOrders}
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" dir="auto">{fill(A.orderTitle, { number: order.number })}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{A.placedOn}: {formatDate(order.createdAt, locale)}</p>
        </div>
        <OrderStatusBadge status={order.status} label={dict.orderStatus[order.status]} />
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* ===== ITEMS + TOTALS ===== */}
        <div className="rounded-xl border">
          <ul className="divide-y">
            {order.lines.map((line) => (
              <li key={line.variantId} className="flex items-center gap-4 p-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {line.imageUrl && <Image src={line.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium">{t(line.name, locale)}</p>
                  <p className="text-muted-foreground">
                    {line.karat}K · {formatWeight(line.weightGrams, locale)} {dict.product.grams}
                    {line.size && <> · {line.size}</>} · × {line.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium">{price(line.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t p-4 text-sm">
            <Row label={C.subtotal} value={price(order.subtotal)} />
            {order.discount > 0 && <Row label={`${C.discount}${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`− ${price(order.discount)}`} />}
            <Row label={C.shipping} value={order.shipping === 0 ? C.free : price(order.shipping)} />
            {order.vat > 0 && <Row label={C.vat.replace("{percent}", String(options.vatPercent))} value={price(order.vat)} />}
            <div className="flex justify-between border-t pt-3 text-base font-bold">
              <dt>{C.total}</dt>
              <dd className="text-primary">{price(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6">
          {/* ===== STATUS TIMELINE ===== */}
          <section className="rounded-xl border p-5">
            <h2 className="mb-4 font-semibold">{A.timeline}</h2>
            <ol className="relative space-y-5 ps-6">
              <span aria-hidden className="absolute inset-y-1 start-[5px] w-px bg-border" />
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={`${h.status}-${h.at}`} className="relative text-sm">
                  <span aria-hidden className={`absolute -start-6 top-1 size-[11px] rounded-full border-2 border-background ${i === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  <p className={i === 0 ? "font-semibold" : ""}>{dict.orderStatus[h.status]}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(h.at, locale)}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ===== DELIVERY + PAYMENT ===== */}
          <section className="space-y-4 rounded-xl border p-5 text-sm">
            <div>
              <p className="text-muted-foreground">{order.deliveryMethod === "store_pickup" ? dict.orderSuccess.pickupFrom : dict.orderSuccess.deliveryTo}</p>
              <p className="mt-1 font-medium">
                {order.deliveryMethod === "store_pickup"
                  ? branch ? `${t(branch.name, locale)} — ${t(branch.address, locale)}` : "—"
                  : a ? [a.street, a.building, a.area, a.city].filter(Boolean).join("، ") : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{dict.orderSuccess.paymentMethod}</p>
              <p className="mt-1 font-medium">{payment ? t(payment.label, locale) : order.paymentMethod}</p>
              {payment?.instructions && order.paymentStatus === "awaiting_transfer" && (
                <p className="mt-2 rounded-md bg-secondary p-3 text-xs leading-relaxed">{t(payment.instructions, locale)}</p>
              )}
            </div>
          </section>

          <p className="text-sm text-muted-foreground">
            {A.reorderHint}{" "}
            <Link href={`/${locale}/contact`} className="text-primary hover:underline">{A.contactUs}</Link>
          </p>
        </div>
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
