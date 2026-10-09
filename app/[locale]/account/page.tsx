/**
 * PAGE: /[locale]/account — ACCOUNT OVERVIEW
 * Greeting, the 3 latest orders, and the saved addresses.
 * Data: GET /storefront/customers/me and /me/orders (mock: .mock-db/db.json)
 */
import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/types";
import { api } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import { getDictionary } from "@/i18n/get-dictionary";
import { fill, t } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/account/OrdersTable";

export async function generateMetadata({ params }: PageProps<"/[locale]/account">): Promise<Metadata> {
  const dict = await getDictionary((await params).locale as Locale);
  return { title: dict.pages.account, robots: { index: false } };
}

export default async function AccountOverviewPage({ params }: PageProps<"/[locale]/account">) {
  const locale = (await params).locale as Locale;
  const session = await requireSession(locale, `/${locale}/account`);
  const [dict, customer, orders, options] = await Promise.all([
    getDictionary(locale),
    api.getCustomer(session),
    api.getCustomerOrders(session),
    api.getCheckoutOptions(),
  ]);
  const A = dict.account;
  const zoneName = (id?: string) => {
    const z = options.shippingZones.find((x) => x.id === id);
    return z ? t(z.name, locale) : "";
  };

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold">{fill(A.hello, { name: customer?.firstName ?? session.firstName })}</h1>
        <p className="mt-2 text-muted-foreground">{A.overviewText}</p>
      </header>

      {/* ===== RECENT ORDERS ===== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{A.recentOrders}</h2>
          {orders.length > 3 && <Link href={`/${locale}/account/orders`} className="text-sm text-primary hover:underline">{A.viewAll}</Link>}
        </div>
        {orders.length ? (
          <OrdersTable orders={orders.slice(0, 3)} locale={locale} dict={dict} />
        ) : (
          <div className="rounded-xl border p-8 text-center">
            <p className="text-muted-foreground">{A.noOrders}</p>
            <Button asChild className="mt-4"><Link href={`/${locale}/products`}>{A.startShopping}</Link></Button>
          </div>
        )}
      </section>

      {/* ===== ADDRESSES ===== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{A.savedAddresses}</h2>
          <Link href={`/${locale}/account/addresses`} className="text-sm text-primary hover:underline">{A.manage}</Link>
        </div>
        {customer?.addresses.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {customer.addresses.slice(0, 2).map((a) => (
              <div key={a.id} className="rounded-xl border p-4 text-sm">
                <p className="font-semibold">{a.label} {a.isDefault && <span className="ms-2 rounded bg-secondary px-2 py-0.5 text-xs">{A.default}</span>}</p>
                <p className="mt-1 text-muted-foreground">{[a.street, a.area, a.city, zoneName(a.shippingZoneId)].filter(Boolean).join("، ")}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border p-6 text-center text-muted-foreground">{A.noAddresses}</p>
        )}
      </section>
    </div>
  );
}
