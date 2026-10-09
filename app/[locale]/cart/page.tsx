/**
 * PAGE: /[locale]/cart — SHOPPING CART
 * Shows what the customer added from product pages (stored in the browser, see stores/cart-store.ts).
 * The list itself is in components/cart/CartView.tsx.
 */
import type { Metadata } from "next";
import type { Locale } from "@/types";
import { getDictionary } from "@/i18n/get-dictionary";
import { clientConfig } from "@/config/clients";
import { PageShell } from "@/components/common/PageShell";
import { CartView } from "@/components/cart/CartView";
import { getSiteOptions } from "@/lib/store-contact";

export async function generateMetadata({ params }: PageProps<"/[locale]/cart">): Promise<Metadata> {
  const dict = await getDictionary((await params).locale as Locale);
  // The cart is personal: keep it out of Google
  return { title: dict.pages.cart, robots: { index: false } };
}

export default async function CartPage({ params }: PageProps<"/[locale]/cart">) {
  const locale = (await params).locale as Locale;
  const [dict, site] = await Promise.all([getDictionary(locale), getSiteOptions()]);

  return (
    <PageShell title={dict.pages.cart}>
      <CartView
        locale={locale}
        labels={dict.cart}
        productLabels={dict.product}
        currency={clientConfig.currency}
        showWeight={site.showWeight}
      />
    </PageShell>
  );
}
