/** List of orders (number, date, status, items, total). Used on the overview and "My orders" pages. */
import Link from "next/link";
import type { Locale, Order } from "@/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import { fill, formatDate, formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrdersTable({ orders, locale, dict }: { orders: Order[]; locale: Locale; dict: Dictionary }) {
  const A = dict.account;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="p-3 text-start font-medium">{A.orderNumber}</th>
            <th className="p-3 text-start font-medium">{A.date}</th>
            <th className="p-3 text-start font-medium">{A.status}</th>
            <th className="p-3 text-start font-medium">{A.total}</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.number} className="border-t">
              <td className="p-3 font-medium" dir="ltr" style={{ textAlign: locale === "ar" ? "right" : "left" }}>{o.number}</td>
              <td className="p-3">{formatDate(o.createdAt, locale)}</td>
              <td className="p-3"><OrderStatusBadge status={o.status} label={dict.orderStatus[o.status]} /></td>
              <td className="p-3">
                {formatPrice(o.total, o.currency, locale)}
                <span className="ms-2 text-xs text-muted-foreground">({fill(A.items, { count: o.lines.reduce((n, l) => n + l.quantity, 0) })})</span>
              </td>
              <td className="p-3 text-end">
                <Link href={`/${locale}/account/orders/${encodeURIComponent(o.number)}`} className="font-medium text-primary hover:underline">
                  {A.view}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
