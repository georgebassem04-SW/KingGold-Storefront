/**
 * ORDER EMAILS — builds and sends the emails for one order.
 * Called after checkout (app/api/checkout/order/route.ts) and by the
 * "resend confirmation" endpoint (app/api/email/order-confirmation/route.ts).
 *
 *   - Customer confirmation: only if the customer gave an email
 *   - Staff copy: to the email in dashboard → Settings → Store details (or ORDERS_NOTIFY_EMAIL in .env.local)
 */
import "server-only";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { clientConfig } from "@/config/clients";
import { getSiteOptions, getStoreContact } from "@/lib/store-contact";
import { getDictionary } from "@/i18n/get-dictionary";
import { getSiteTheme } from "@/lib/site-theme";
import { sendEmail, type SendResult } from "./send";
import { orderConfirmationEmail, staffNewOrderEmail } from "./templates/order-confirmation";

export interface OrderEmailsResult {
  customer: SendResult | "skipped_no_email";
  staff: SendResult | "skipped_not_configured";
}

export async function sendOrderEmails(orderNumber: string, options: { staff?: boolean } = { staff: true }): Promise<OrderEmailsResult | null> {
  const order = await api.getOrder(orderNumber);
  if (!order) return null;

  const locale: Locale = order.locale ?? clientConfig.defaultLocale;
  const [dict, checkout, branches, site, { contact }] = await Promise.all([getDictionary(locale), api.getCheckoutOptions(), api.getBranches(), getSiteTheme(), getStoreContact()]);
  const input = {
    order,
    locale,
    dict,
    site,
    contact,
    payment: checkout.paymentMethods.find((m) => m.id === order.paymentMethodId),
    branch: branches.find((b) => b.id === order.pickupBranchId),
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  };

  // Customer
  let customer: OrderEmailsResult["customer"] = "skipped_no_email";
  if (order.customer.email) {
    const mail = orderConfirmationEmail(input);
    customer = await sendEmail({ to: order.customer.email, ...mail, replyTo: contact.email });
  }

  // Store team
  let staff: OrderEmailsResult["staff"] = "skipped_not_configured";
  const staffTo = (await getSiteOptions()).ordersNotifyEmail;
  if (options.staff && staffTo) {
    const mail = staffNewOrderEmail({ ...input, locale: clientConfig.defaultLocale, dict: await getDictionary(clientConfig.defaultLocale) });
    staff = await sendEmail({ to: staffTo, ...mail, replyTo: order.customer.email });
  }

  return { customer, staff };
}
