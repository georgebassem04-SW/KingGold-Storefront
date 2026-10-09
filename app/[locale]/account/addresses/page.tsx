/**
 * PAGE: /[locale]/account/addresses — SAVED ADDRESSES
 * Add, edit, delete, set default. Saved addresses appear at checkout.
 * The list itself: components/account/AddressBook.tsx
 */
import type { Metadata } from "next";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import { getDictionary } from "@/i18n/get-dictionary";
import { AddressBook } from "@/components/account/AddressBook";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/addresses">): Promise<Metadata> {
  const dict = await getDictionary((await params).locale as Locale);
  return { title: dict.account.addressesTitle, robots: { index: false } };
}

export default async function AddressesPage({ params }: PageProps<"/[locale]/account/addresses">) {
  const locale = (await params).locale as Locale;
  const session = await requireSession(locale, `/${locale}/account/addresses`);
  const [dict, customer, options] = await Promise.all([getDictionary(locale), api.getCustomer(session), api.getCheckoutOptions()]);
  if (!customer) return null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{dict.account.addressesTitle}</h1>
        <p className="mt-2 text-muted-foreground">{dict.account.addressesSubtitle}</p>
      </header>
      <AddressBook
        locale={locale}
        initial={customer.addresses}
        zones={options.shippingZones.filter((z) => z.isActive)}
        defaults={{ fullName: `${customer.firstName} ${customer.lastName}`.trim(), phone: customer.phone }}
        labels={dict.account}
        authLabels={dict.auth}
        checkoutLabels={dict.checkout}
      />
    </div>
  );
}
