/**
 * PAGE: /[locale]/checkout — CHECKOUT
 * ------------------------------------------------------------------
 * Loads the checkout rules from the dashboard and hands them to the form:
 *   GET /storefront/checkout-options -> areas + delivery fees, payment methods, VAT rule, minimum order
 *   GET /storefront/branches         -> branches that accept store pickup
 * (mock: mock-data/checkout-options.json and mock-data/branches.json)
 *
 * The form itself: components/checkout/CheckoutForm.tsx
 * Store pickup / guest checkout switches: config/clients/demo.ts -> features
 * Logged-in customers get their details and saved addresses filled in automatically.
 */
import type { Metadata } from "next";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { clientConfig } from "@/config/clients";
import { getDictionary } from "@/i18n/get-dictionary";
import { PageShell } from "@/components/common/PageShell";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getSession } from "@/lib/auth/session";
import { getSiteOptions } from "@/lib/store-contact";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const dict = await getDictionary((await params).locale as Locale);
  return { title: dict.pages.checkout, robots: { index: false } };
}

export default async function CheckoutPage({ params }: PageProps<"/[locale]/checkout">) {
  const locale = (await params).locale as Locale;
  const session = await getSession();
  const [dict, options, branches, customer, site] = await Promise.all([
    getDictionary(locale),
    api.getCheckoutOptions(),
    api.getBranches(),
    // Logged in -> prefill name, phone, email and saved addresses
    session ? api.getCustomer(session) : Promise.resolve(null),
    getSiteOptions(), // dashboard → Settings → Store details → Website options
  ]);

  return (
    <PageShell title={dict.pages.checkout}>
      <CheckoutForm
        customer={customer ? { firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone, addresses: customer.addresses } : null}
        locale={locale}
        labels={dict.checkout}
        productLabels={dict.product}
        options={options}
        branches={branches
          .filter((b) => b.isPickupPoint)
          .map((b) => ({ id: b.id, name: b.name, address: b.address, hours: b.hours }))}
        // Store pickup: switched on/off in the dashboard (Shipping & payment); the client config is the fallback
        storePickupEnabled={options.storePickup ?? clientConfig.features.storePickup}
        guestCheckout={site.guestCheckout}
        currency={clientConfig.currency}
      />
    </PageShell>
  );
}
