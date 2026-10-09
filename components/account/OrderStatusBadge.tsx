/** Coloured status pill for an order. Labels: i18n/dictionaries/*.json -> "orderStatus" */
import type { OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

const COLORS: Record<OrderStatus, string> = {
  pending: "bg-sky-50 text-sky-800",
  confirmed: "bg-indigo-50 text-indigo-800",
  processing: "bg-amber-50 text-amber-800",
  ready_for_pickup: "bg-emerald-50 text-emerald-800",
  shipped: "bg-violet-50 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-muted text-muted-foreground",
  returned: "bg-rose-50 text-rose-800",
};

export function OrderStatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-medium", COLORS[status])}>{label}</span>;
}
