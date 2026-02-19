"use client";

import { useEffect, useRef, useState } from "react";
import { useOrders } from "@/hooks/use-api";
import { connectOrderSSE } from "@/lib/api";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import type { Order } from "@caloriehero/shared-types";

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

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// SSE connection indicator for a single order
function OrderSSEIndicator({ orderId }: { orderId: string }) {
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = connectOrderSSE(orderId);
    esRef.current = es;

    es.addEventListener("open", () => setConnected(true));
    es.addEventListener("error", () => setConnected(false));

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [orderId]);

  return connected ? (
    <span title="Live SSE connected" className="inline-flex items-center gap-1 text-xs text-green-600">
      <Wifi className="h-3 w-3" /> Live
    </span>
  ) : (
    <span title="SSE disconnected" className="inline-flex items-center gap-1 text-xs text-zinc-400">
      <WifiOff className="h-3 w-3" /> Offline
    </span>
  );
}

export default function OrdersPage() {
  const { orders, loading, error, refetch } = useOrders();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {orders.length} orders — live updates via SSE
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          API unavailable — showing mock data
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Loading orders...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Order ID</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Type</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">Items</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">Total</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Created</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-500">Live</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-zinc-600">
                      #{order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-zinc-600">
                    {order.type.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700">
                    {order.items.length}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    ฿{order.total}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] ?? "bg-zinc-100 text-zinc-500"}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {order.status !== "delivered" && order.status !== "cancelled" ? (
                      <OrderSSEIndicator orderId={order.id} />
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && orders.length === 0 && (
          <div className="py-12 text-center text-sm text-zinc-400">No orders found</div>
        )}
      </div>
    </div>
  );
}
