"use client";

import { mockMeals } from "@/lib/mock-data";
import { useOrders } from "@/hooks/use-api";
import { UtensilsCrossed, ShoppingCart, Users, TrendingUp } from "lucide-react";
import type { Order } from "@caloriehero/shared-types";

const stats = [
  { label: "Active Meals", value: mockMeals.filter((m) => m.active).length, icon: UtensilsCrossed, color: "bg-blue-50 text-blue-600" },
  { label: "Orders Today", value: 23, icon: ShoppingCart, color: "bg-green-50 text-green-600" },
  { label: "Active Customers", value: 148, icon: Users, color: "bg-purple-50 text-purple-600" },
  { label: "Revenue Today", value: "฿12,450", icon: TrendingUp, color: "bg-orange-50 text-orange-600" },
];

const statusColors: Record<string, string> = {
  pending_payment: "bg-zinc-100 text-zinc-500",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-yellow-100 text-yellow-700",
  ready: "bg-green-100 text-green-700",
  out_for_delivery: "bg-purple-100 text-purple-700",
  delivered: "bg-zinc-100 text-zinc-600",
  cancelled: "bg-red-100 text-red-700",
};

function statusLabel(status: Order["status"]): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Dashboard() {
  const { orders, loading, error } = useOrders();

  // Show most recent 5 orders
  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">Overview of today&apos;s operations</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-500">{label}</span>
              <div className={`rounded-md p-2 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          {loading && (
            <span className="text-xs text-zinc-400">Loading...</span>
          )}
          {error && (
            <span className="text-xs text-amber-600">Using mock data</span>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">No orders found.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-md border border-zinc-100 px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-medium text-zinc-900">
                    #{order.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs capitalize text-zinc-500">{order.type.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-medium">฿{order.total}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] ?? "bg-zinc-100 text-zinc-500"}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
