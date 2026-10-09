/**
 * PAGE: /[locale]/account/orders — ORDER HISTORY
 * Every order the customer placed while logged in, newest first, with its status.
 * Data: GET /storefront/customers/me/orders (mock: .mock-db/db.json)
 */
import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import { getDictionary } from "@/i18n/get-dictionary";
import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/account/OrdersTable";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/orders">): Promise<Metadata> {
  const dict = await getDictionary((await params).locale as Locale);
  return { title: dict.account.ordersTitle, robots: { index: false } };
}

export default async function OrdersPage({ params }: PageProps<"/[locale]/account/orders">) {
  const locale = (await params).locale as Locale;
  const session = await requireSession(locale, `/${locale}/account/orders`);
  const [dict, orders] = await Promise.all([getDictionary(locale), api.getCustomerOrders(session)]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{dict.account.ordersTitle}</h1>
      {orders.length ? (
        <OrdersTable orders={orders} locale={locale} dict={dict} />
      ) : (
        <div className="rounded-xl border p-10 text-center">
          <p className="text-muted-foreground">{dict.account.noOrders}</p>
          <Button asChild className="mt-4"><Link href={`/${locale}/products`}>{dict.account.startShopping}</Link></Button>
        </div>
      )}
    </div>
  );
}
