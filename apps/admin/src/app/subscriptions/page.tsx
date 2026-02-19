"use client";

import { useSubscriptions, useCustomers } from "@/hooks/use-api";
import { RefreshCw } from "lucide-react";
import type { SubscriptionStatus } from "@caloriehero/shared-types";

const statusColors: Record<SubscriptionStatus, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-600",
  past_due: "bg-orange-100 text-orange-700",
};

function formatDays(days: string[]): string {
  return days.map((d) => d.slice(0, 3).charAt(0).toUpperCase() + d.slice(1, 3)).join(", ");
}

export default function SubscriptionsPage() {
  const { subscriptions, loading, error, refetch } = useSubscriptions();
  const { customers } = useCustomers();

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const active = subscriptions.filter((s) => s.status === "active").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {active} active of {subscriptions.length} total
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
          <div className="py-12 text-center text-sm text-zinc-400">Loading subscriptions...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Customer</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Schedule</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">Meals/day</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">Cal target</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">Macro targets (P/C/F)</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => {
                const customer = customerMap.get(sub.userId);
                return (
                  <tr key={sub.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-zinc-900">
                          {customer?.name ?? `User ${sub.userId.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-zinc-400">{customer?.email ?? ""}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[sub.status]}`}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-700">{formatDays(sub.schedule.days)}</p>
                      <p className="text-xs text-zinc-400">{sub.schedule.timeSlot}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-700">
                      {sub.schedule.mealsPerDay}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-700">
                      {sub.macroTargets.calories} kcal
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <span className="text-blue-600">{sub.macroTargets.protein}g</span>
                      {" / "}
                      <span className="text-amber-600">{sub.macroTargets.carbs}g</span>
                      {" / "}
                      <span className="text-red-500">{sub.macroTargets.fat}g</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && subscriptions.length === 0 && (
          <div className="py-12 text-center text-sm text-zinc-400">No subscriptions found</div>
        )}
      </div>
    </div>
  );
}
