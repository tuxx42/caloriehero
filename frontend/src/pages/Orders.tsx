import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listOrders } from "../api/endpoints/orders";
import type { Order } from "../api/types";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { StatusBadge } from "../components/common/StatusBadge";
import { PackageIcon } from "../components/icons/Icons";

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex justify-center mb-4">
          <PackageIcon className="w-16 h-16 text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No orders yet
        </h2>
        <p className="text-gray-500 mb-6">Your order history will appear here</p>
        <Link
          to="/meals"
          className="inline-block px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl"
        >
          Browse Meals
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Orders</h1>
      {orders.map((order) => (
        <Link
          key={order.id}
          to={`/orders/${order.id}`}
          className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 truncate max-w-[60%]">
              {order.items.map((i) => i.meal_name).join(", ")}
            </span>
            <span className="font-bold text-gray-900">
              ฿{order.total.toFixed(0)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
