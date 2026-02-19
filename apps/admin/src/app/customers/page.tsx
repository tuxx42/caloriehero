"use client";

import { useCustomers, useSubscriptions } from "@/hooks/use-api";
import { RefreshCw } from "lucide-react";
import type { SubscriptionStatus } from "@caloriehero/shared-types";

const subscriptionStatusColors: Record<SubscriptionStatus, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-600",
  past_due: "bg-orange-100 text-orange-700",
};

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CustomersPage() {
  const { customers, loading, error, refetch } = useCustomers();
  const { subscriptions } = useSubscriptions();

  // Build a lookup from userId to subscription status
  const subByUser = new Map(subscriptions.map((s) => [s.userId, s]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {customers.length} registered customer{customers.length !== 1 ? "s" : ""}
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
          <div className="py-12 text-center text-sm text-zinc-400">Loading customers...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Email</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-500">Admin</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-500">Subscription</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const sub = subByUser.get(customer.id);
                return (
                  <tr key={customer.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{customer.email}</td>
                    <td className="px-4 py-3 text-center">
                      {customer.isAdmin ? (
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                          Admin
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {sub ? (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${subscriptionStatusColors[sub.status]}`}
                        >
                          {sub.status.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDate(customer.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && customers.length === 0 && (
          <div className="py-12 text-center text-sm text-zinc-400">No customers found</div>
        )}
      </div>
    </div>
  );
}
