"use client";

import { useMeals, useOrders } from "@/hooks/use-api";
import { UtensilsCrossed, ShoppingCart, TrendingUp, BarChart3 } from "lucide-react";
import type { MealCategory } from "@caloriehero/shared-types";

const categoryColors: Record<MealCategory, string> = {
  breakfast: "bg-amber-500",
  lunch: "bg-blue-500",
  dinner: "bg-purple-500",
  snack: "bg-green-500",
};

const categoryLabels: Record<MealCategory, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-zinc-300",
  confirmed: "bg-blue-400",
  preparing: "bg-yellow-400",
  ready: "bg-green-400",
  out_for_delivery: "bg-purple-400",
  delivered: "bg-zinc-400",
  cancelled: "bg-red-400",
};

function formatCurrency(value: number): string {
  return `฿${value.toLocaleString("en-US")}`;
}

export default function AnalyticsPage() {
  const { meals, loading: mealsLoading } = useMeals();
  const { orders, loading: ordersLoading } = useOrders();

  const loading = mealsLoading || ordersLoading;

  // Stat calculations
  const totalMeals = meals.length;
  const activeMeals = meals.filter((m) => m.active).length;
  const totalOrders = orders.length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "pending_payment")
    .reduce((sum, o) => sum + o.total, 0);

  // Meals by category
  const categories: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"];
  const categoryCount = categories.map((cat) => ({
    cat,
    count: meals.filter((m) => m.category === cat).length,
  }));
  const maxCategoryCount = Math.max(...categoryCount.map((c) => c.count), 1);

  // Orders by status
  const statusGroups = Object.entries(
    orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const maxStatusCount = Math.max(...statusGroups.map((s) => s[1]), 1);

  // Average order value
  const avgOrderValue =
    totalOrders > 0
      ? Math.round(orders.reduce((s, o) => s + o.total, 0) / totalOrders)
      : 0;

  const statCards = [
    {
      label: "Total Meals",
      value: `${activeMeals} / ${totalMeals}`,
      sub: "active / total",
      icon: UtensilsCrossed,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Orders",
      value: totalOrders,
      sub: "all time",
      icon: ShoppingCart,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Revenue",
      value: formatCurrency(revenue),
      sub: "confirmed orders",
      icon: TrendingUp,
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "Avg. Order Value",
      value: formatCurrency(avgOrderValue),
      sub: "per order",
      icon: BarChart3,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Revenue, meal distribution, and order insights
      </p>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-500">{label}</span>
              <div className={`rounded-md p-2 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
            <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Meal category distribution */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-800">Meals by Category</h2>
          <p className="mt-0.5 text-xs text-zinc-400">{activeMeals} active meals</p>

          {loading ? (
            <div className="mt-6 text-center text-sm text-zinc-400">Loading...</div>
          ) : (
            <div className="mt-6 space-y-4">
              {categoryCount.map(({ cat, count }) => (
                <div key={cat}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-700">{categoryLabels[cat]}</span>
                    <span className="text-zinc-500">{count} meals</span>
                  </div>
                  <div className="h-7 w-full overflow-hidden rounded-md bg-zinc-100">
                    <div
                      className={`h-full rounded-md transition-all ${categoryColors[cat]}`}
                      style={{
                        width: `${count === 0 ? 0 : Math.max(4, (count / maxCategoryCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-800">Orders by Status</h2>
          <p className="mt-0.5 text-xs text-zinc-400">{totalOrders} total orders</p>

          {loading ? (
            <div className="mt-6 text-center text-sm text-zinc-400">Loading...</div>
          ) : statusGroups.length === 0 ? (
            <div className="mt-6 text-center text-sm text-zinc-400">No orders yet</div>
          ) : (
            <div className="mt-6 space-y-4">
              {statusGroups.map(([status, count]) => {
                const label = status
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ");
                return (
                  <div key={status}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-700">{label}</span>
                      <span className="text-zinc-500">{count}</span>
                    </div>
                    <div className="h-7 w-full overflow-hidden rounded-md bg-zinc-100">
                      <div
                        className={`h-full rounded-md transition-all ${ORDER_STATUS_COLORS[status] ?? "bg-zinc-400"}`}
                        style={{
                          width: `${Math.max(4, (count / maxStatusCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Price distribution table */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-800">Top Meals by Price</h2>
        <p className="mt-0.5 text-xs text-zinc-400">Active meals sorted by price</p>
        <div className="mt-4 overflow-hidden rounded-md border border-zinc-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Meal</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Category</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-500">Calories</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-500">Price</th>
              </tr>
            </thead>
            <tbody>
              {[...meals]
                .filter((m) => m.active)
                .sort((a, b) => b.price - a.price)
                .slice(0, 5)
                .map((meal) => (
                  <tr key={meal.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-4 py-2 font-medium text-zinc-900">{meal.name}</td>
                    <td className="px-4 py-2 capitalize text-zinc-600">{meal.category}</td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-700">
                      {meal.nutritionalInfo.calories} kcal
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium text-zinc-900">
                      ฿{meal.price}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {meals.filter((m) => m.active).length === 0 && (
            <div className="py-6 text-center text-sm text-zinc-400">No active meals</div>
          )}
        </div>
      </div>
    </div>
  );
}
