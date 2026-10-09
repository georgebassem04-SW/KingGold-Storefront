/**
 * STORE CONTACT DETAILS — phone, WhatsApp, email, address, hours and social links for the whole website
 * (footer, header buttons, contact page, product WhatsApp button, order emails).
 *
 *   1) Starts from config/clients/<client>.ts → contact / social (the defaults)
 *   2) Uses what the dashboard saved in Settings → Store details (lib/api → getStoreSettings) when there is one
 * Empty values from the dashboard (e.g. no WhatsApp) hide that line / button on the website.
 * Use it in server components:  const { contact, social } = await getStoreContact();
 *
 * WEBSITE OPTIONS — getSiteOptions(): order without an account, show weight, gold prices block, new-order alert email
 * (dashboard → Settings → Store details → Website options; defaults: config/clients/<client>.ts → features).
 */
import { cache } from "react";
import type { SiteOptions, StoreSettings } from "@/types";
import { api } from "@/lib/api";
import { clientConfig } from "@/config/clients";

/** One request per page for both helpers */
const saved = cache(async () => api.getStoreSettings().catch(() => null));

const clean = (v?: string) => (v && v.trim() ? v.trim() : undefined);
const text = (v?: { ar: string; en: string }) => (v && (v.ar.trim() || v.en.trim()) ? v : undefined);

export const getStoreContact = cache(async (): Promise<StoreSettings> => {
  const s = await saved();
  if (!s?.contact) return { contact: clientConfig.contact, social: clientConfig.social ?? {} };
  const c = s.contact;
  return {
    contact: {
      email: clean(c.email) ?? clientConfig.contact.email,
      phone: clean(c.phone) ?? clientConfig.contact.phone,
      whatsapp: clean(c.whatsapp),
      address: text(c.address),
      hours: text(c.hours),
    },
    social: Object.fromEntries(Object.entries(s.social ?? {}).filter(([, url]) => clean(url))),
  };
});

export const getSiteOptions = cache(async (): Promise<SiteOptions & { ordersNotifyEmail?: string }> => {
  const s = await saved();
  const f = clientConfig.features;
  return {
    guestCheckout: s?.options?.guestCheckout ?? f.guestCheckout,
    showWeight: s?.options?.showWeight ?? f.showWeight,
    showGoldPrices: s?.options?.showGoldPrices ?? f.showGoldPrices,
    ordersNotifyEmail: clean(s?.ordersNotifyEmail) ?? process.env.ORDERS_NOTIFY_EMAIL,
  };
});
