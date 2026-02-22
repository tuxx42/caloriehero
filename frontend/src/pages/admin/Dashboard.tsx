import { useEffect, useState } from "react";
import { getDashboardStats, type DashboardStats } from "../../api/endpoints/admin";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <p className="text-gray-500">Failed to load stats</p>;

  const cards = [
    { label: "Total Users", value: stats.total_users, color: "bg-blue-500" },
    { label: "Total Orders", value: stats.total_orders, color: "bg-emerald-500" },
    { label: "Active Meals", value: stats.total_meals, color: "bg-amber-500" },
    { label: "Active Subs", value: stats.active_subscriptions, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            <div className={`h-1 w-12 ${card.color} rounded-full mt-2`} />
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Total Revenue</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          ฿{stats.revenue.toLocaleString()}
        </p>
      </div>

      {/* Orders by status */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Orders by Status</h2>
        <div className="space-y-2">
          {Object.entries(stats.orders_by_status).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 capitalize">
                {status.replace("_", " ")}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (count / stats.total_orders) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-right">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
