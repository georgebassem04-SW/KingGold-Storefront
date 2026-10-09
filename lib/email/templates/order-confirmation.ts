/**
 * ORDER CONFIRMATION EMAIL — sent to the customer after checkout.
 * ------------------------------------------------------------------
 * Written in the language the customer ordered in (right-to-left for Arabic).
 * Email apps ignore most modern CSS, so this uses simple tables and inline styles on purpose.
 *
 * Where to edit:
 *   - Texts (AR/EN)          -> i18n/dictionaries/*.json -> "emails.orderConfirmation"
 *   - Colours / store name   -> dashboard → Theme & design (passed in as `site`; defaults: config/clients/demo.ts)
 *   - Layout                 -> this file
 *
 * Also here: staffNewOrderEmail() — the short copy sent to the store team.
 */
import type { Branch, Locale, Order, PaymentMethodOption, SiteTheme, StoreContact } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { clientConfig } from "@/config/clients";
import { fill, formatDate, formatPrice, formatWeight, t } from "@/lib/format";

interface Input {
  order: Order;
  /** The published website look (colours + store name). Missing = client defaults. */
  site?: SiteTheme;
  locale: Locale;
  dict: Dictionary;
  payment?: PaymentMethodOption;
  branch?: Branch;
  siteUrl: string;
  /** Store phone / email for "Questions?" (dashboard → Settings → Store details). Missing = client defaults */
  contact?: StoreContact;
}

/** Stops customer-typed text (name, address) from breaking the HTML */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function orderConfirmationEmail({ order, locale, dict, payment, branch, siteUrl, site, contact = clientConfig.contact }: Input) {
  const L = dict.emails.orderConfirmation;
  const rtl = locale === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const start = rtl ? "right" : "left";
  const end = rtl ? "left" : "right";
  const c = site?.colors ?? clientConfig.theme.colors;
  const store = t(site?.brand.name ?? clientConfig.name, locale);
  const price = (n: number) => formatPrice(n, order.currency, locale);
  const isPickup = order.deliveryMethod === "store_pickup";
  const orderUrl = `${siteUrl}/${locale}/order-success?order=${encodeURIComponent(order.number)}`;

  const subject = fill(L.subject, { number: order.number, store });

  // ----- items -----
  const itemRows = order.lines
    .map((l) => {
      const details = [`${l.karat}K`, `${formatWeight(l.weightGrams, locale)} ${L.weight}`, l.size ? `${L.size}: ${esc(l.size)}` : ""]
        .filter(Boolean)
        .join(" · ");
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${c.border};text-align:${start};">
            <div style="font-weight:600;color:${c.foreground};">${esc(t(l.name, locale))}</div>
            <div style="font-size:13px;color:${c.mutedForeground};margin-top:2px;">${details}</div>
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid ${c.border};text-align:center;color:${c.foreground};">${l.quantity}</td>
          <td style="padding:12px 0;border-bottom:1px solid ${c.border};text-align:${end};white-space:nowrap;color:${c.foreground};">${price(l.lineTotal)}</td>
        </tr>`;
    })
    .join("");

  // ----- totals -----
  const totalRow = (label: string, value: string, bold = false) => `
    <tr>
      <td style="padding:4px 0;text-align:${start};color:${bold ? c.foreground : c.mutedForeground};${bold ? "font-weight:700;font-size:16px;" : ""}">${label}</td>
      <td style="padding:4px 0;text-align:${end};white-space:nowrap;${bold ? `font-weight:700;font-size:16px;color:${c.primary};` : `color:${c.foreground};`}">${value}</td>
    </tr>`;
  const totals = [
    totalRow(L.subtotal, price(order.subtotal)),
    order.discount > 0 ? totalRow(`${L.discount}${order.couponCode ? ` (${esc(order.couponCode)})` : ""}`, `− ${price(order.discount)}`) : "",
    totalRow(L.shipping, order.shipping === 0 ? L.free : price(order.shipping)),
    order.vat > 0 ? totalRow(L.vat, price(order.vat)) : "",
    totalRow(L.total, price(order.total), true),
  ].join("");

  // ----- delivery / pickup -----
  const a = order.shippingAddress;
  const whereText = isPickup
    ? branch
      ? `${esc(t(branch.name, locale))}<br>${esc(t(branch.address, locale))}<br>${esc(t(branch.hours, locale))}`
      : "—"
    : a
      ? [a.street, a.building, a.area, a.city].filter(Boolean).map((x) => esc(x!)).join("<br>")
      : "—";

  const bankBox = payment?.instructions
    ? `<tr><td style="padding:0 32px 24px;">
         <div style="border:1px solid ${c.primary};background:${c.secondary};border-radius:8px;padding:16px;text-align:${start};">
           <div style="font-weight:700;margin-bottom:6px;color:${c.foreground};">${L.bankTitle}</div>
           <div style="font-size:14px;line-height:1.6;color:${c.foreground};">${esc(t(payment.instructions, locale))}</div>
         </div></td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Tahoma,Arial,Helvetica,sans-serif;">
  <!-- preheader: the grey line shown after the subject in the inbox -->
  <div style="display:none;max-height:0;overflow:hidden;">${L.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="${dir}" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- header -->
        <tr><td style="background:${c.headerBackground};color:${c.headerForeground};padding:24px 32px;text-align:center;font-size:22px;font-weight:700;">${esc(store)}</td></tr>

        <!-- greeting -->
        <tr><td style="padding:32px 32px 8px;text-align:${start};color:${c.foreground};">
          <h1 style="margin:0 0 12px;font-size:20px;">${esc(fill(L.hello, { name: order.customer.name }))}</h1>
          <p style="margin:0;line-height:1.7;color:${c.mutedForeground};">${L.intro}</p>
        </td></tr>

        <!-- order number + date -->
        <tr><td style="padding:16px 32px;">
          <table role="presentation" width="100%" style="background:${c.secondary};border-radius:8px;">
            <tr>
              <td style="padding:14px 16px;text-align:${start};"><div style="font-size:12px;color:${c.mutedForeground};">${L.orderNumber}</div><div style="font-weight:700;font-size:16px;color:${c.foreground};" dir="ltr">${esc(order.number)}</div></td>
              <td style="padding:14px 16px;text-align:${end};"><div style="font-size:12px;color:${c.mutedForeground};">${L.date}</div><div style="font-weight:600;color:${c.foreground};">${formatDate(order.createdAt, locale)}</div></td>
            </tr>
          </table>
        </td></tr>

        <!-- items -->
        <tr><td style="padding:8px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr>
              <th style="text-align:${start};padding-bottom:8px;border-bottom:2px solid ${c.foreground};font-size:12px;color:${c.mutedForeground};">${L.item}</th>
              <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid ${c.foreground};font-size:12px;color:${c.mutedForeground};">${L.qty}</th>
              <th style="text-align:${end};padding-bottom:8px;border-bottom:2px solid ${c.foreground};font-size:12px;color:${c.mutedForeground};">${L.price}</th>
            </tr>
            ${itemRows}
          </table>
        </td></tr>

        <!-- totals -->
        <tr><td style="padding:12px 32px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${totals}</table>
        </td></tr>

        <!-- delivery + payment -->
        <tr><td style="padding:0 32px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr>
              <td valign="top" style="width:50%;padding-${end}:12px;text-align:${start};">
                <div style="font-size:12px;color:${c.mutedForeground};margin-bottom:4px;">${isPickup ? L.pickupFrom : L.deliveryTo}</div>
                <div style="line-height:1.6;color:${c.foreground};">${whereText}</div>
              </td>
              <td valign="top" style="width:50%;text-align:${start};">
                <div style="font-size:12px;color:${c.mutedForeground};margin-bottom:4px;">${L.payment}</div>
                <div style="color:${c.foreground};">${payment ? esc(t(payment.label, locale)) : esc(order.paymentMethod)}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        ${bankBox}

        <!-- button -->
        <tr><td align="center" style="padding:8px 32px 32px;">
          <a href="${orderUrl}" style="display:inline-block;background:${c.primary};color:${c.primaryForeground};text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">${L.viewOrder}</a>
        </td></tr>

        <!-- footer -->
        <tr><td style="background:${c.footerBackground};color:${c.footerForeground};padding:20px 32px;text-align:center;font-size:13px;line-height:1.6;">
          ${esc(L.questions).replace("{phone}", `<span dir="ltr" style="unicode-bidi:isolate;direction:ltr;">&#8206;${esc(contact.phone)}&#8206;</span>`)}<br>
          <a href="mailto:${contact.email}" style="color:${c.footerForeground};">${contact.email}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Plain-text version (shown by email apps that block HTML)
  const text = [
    fill(L.hello, { name: order.customer.name }),
    "",
    L.intro,
    "",
    `${L.orderNumber}: ${order.number}`,
    `${L.date}: ${formatDate(order.createdAt, locale)}`,
    "",
    ...order.lines.map((l) => `- ${t(l.name, locale)} (${l.karat}K, ${l.weightGrams}${L.weight}${l.size ? `, ${l.size}` : ""}) × ${l.quantity} = ${price(l.lineTotal)}`),
    "",
    `${L.subtotal}: ${price(order.subtotal)}`,
    order.discount > 0 ? `${L.discount}: -${price(order.discount)}` : "",
    `${L.shipping}: ${order.shipping === 0 ? L.free : price(order.shipping)}`,
    order.vat > 0 ? `${L.vat}: ${price(order.vat)}` : "",
    `${L.total}: ${price(order.total)}`,
    "",
    payment?.instructions ? `${L.bankTitle}: ${t(payment.instructions, locale)}` : "",
    `${L.viewOrder}: ${orderUrl}`,
    "",
    fill(L.questions, { phone: contact.phone }),
  ]
    .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
    .join("\n");

  return { subject, html, text };
}

/** Short email to the store team for every new order */
export function staffNewOrderEmail({ order, locale, dict, payment, branch, siteUrl }: Input) {
  const L = dict.emails.orderConfirmation;
  const price = (n: number) => formatPrice(n, order.currency, locale);
  const subject = fill(L.staffSubject, { number: order.number, total: price(order.total) });
  const lines = [
    L.staffIntro,
    "",
    `${L.orderNumber}: ${order.number}`,
    `${order.customer.name} — ${order.customer.phone}${order.customer.email ? ` — ${order.customer.email}` : ""}`,
    `${L.payment}: ${payment ? t(payment.label, locale) : order.paymentMethod}`,
    order.deliveryMethod === "store_pickup"
      ? `${L.pickupFrom}: ${branch ? t(branch.name, locale) : "—"}`
      : `${L.deliveryTo}: ${[order.shippingAddress?.street, order.shippingAddress?.area, order.shippingAddress?.city].filter(Boolean).join(", ")}`,
    "",
    ...order.lines.map((l) => `- ${l.sku} ${t(l.name, locale)} × ${l.quantity} = ${price(l.lineTotal)}`),
    "",
    `${L.total}: ${price(order.total)}`,
    order.notes ? `\n${order.notes}` : "",
    `${siteUrl}/${locale}/order-success?order=${encodeURIComponent(order.number)}`,
  ];
  const text = lines.join("\n");
  const html = `<pre style="font-family:Tahoma,Arial,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;" dir="${locale === "ar" ? "rtl" : "ltr"}">${esc(text)}</pre>`;
  return { subject, html, text };
}
