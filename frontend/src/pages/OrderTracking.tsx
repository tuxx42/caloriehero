import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { getOrder } from "../api/endpoints/orders";
import type { Order } from "../api/types";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { OrderTimeline } from "../components/orders/OrderTimeline";
import { useSSE } from "../hooks/useSSE";

export function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    getOrder(orderId)
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  // SSE for live updates
  useSSE(orderId ? `/sse/orders/${orderId}` : null, {
    onMessage: (data) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.status && order) {
          setOrder({ ...order, status: parsed.status });
        }
      } catch {
        // ignore
      }
    },
  });

  if (loading) return <LoadingSpinner />;
  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Order Tracking</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <OrderTimeline currentStatus={order.status} />
      </div>

      {/* Order details */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
        <h2 className="font-semibold text-gray-900">Order Details</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-600">
              {item.meal_name} x {item.quantity}
            </span>
            <span className="font-medium text-gray-900">
              ฿{(item.unit_price * item.quantity).toFixed(0)}
            </span>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-3 flex justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-bold">฿{order.total.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
