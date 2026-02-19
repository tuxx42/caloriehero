"use client";

import { useState, useEffect, useCallback } from "react";
import type { Meal, Order, User, Subscription } from "@caloriehero/shared-types";
import { mockMeals } from "@/lib/mock-data";
import * as api from "@/lib/api";

// ---------------------------------------------------------------------------
// Generic fetch hook factory
// ---------------------------------------------------------------------------

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useApiData<T>(
  fetcher: () => Promise<T>,
  fallback?: T
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
          if (fallback !== undefined) {
            setData(fallback);
          }
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { data, loading, error, refetch };
}

// ---------------------------------------------------------------------------
// useMeals
// ---------------------------------------------------------------------------

export interface UseMealsResult {
  meals: Meal[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMeals(): UseMealsResult {
  const { data, loading, error, refetch } = useApiData<Meal[]>(
    () => api.listMeals(),
    mockMeals
  );
  return { meals: data ?? mockMeals, loading, error, refetch };
}

// ---------------------------------------------------------------------------
// useOrders
// ---------------------------------------------------------------------------

export interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const MOCK_ORDERS: Order[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    userId: "00000000-0000-0000-0000-000000000010",
    status: "preparing",
    type: "on_demand",
    items: [
      { id: "00000000-0000-0000-0000-000000000101", mealId: "00000000-0000-0000-0000-000000000201", mealName: "Grilled Chicken Breast", quantity: 2, unitPrice: 189 },
      { id: "00000000-0000-0000-0000-000000000102", mealId: "00000000-0000-0000-0000-000000000202", mealName: "Protein Oatmeal", quantity: 1, unitPrice: 149 },
    ],
    total: 527,
    createdAt: new Date("2026-02-20T08:12:00Z"),
    updatedAt: new Date("2026-02-20T08:30:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    userId: "00000000-0000-0000-0000-000000000011",
    status: "ready",
    type: "subscription",
    items: [
      { id: "00000000-0000-0000-0000-000000000103", mealId: "00000000-0000-0000-0000-000000000203", mealName: "Salmon Poke Bowl", quantity: 1, unitPrice: 259 },
    ],
    total: 259,
    createdAt: new Date("2026-02-20T07:45:00Z"),
    updatedAt: new Date("2026-02-20T09:00:00Z"),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    userId: "00000000-0000-0000-0000-000000000012",
    status: "delivered",
    type: "on_demand",
    items: [
      { id: "00000000-0000-0000-0000-000000000104", mealId: "00000000-0000-0000-0000-000000000204", mealName: "Thai Basil Tofu Stir-fry", quantity: 2, unitPrice: 169 },
    ],
    total: 338,
    createdAt: new Date("2026-02-20T06:00:00Z"),
    updatedAt: new Date("2026-02-20T07:15:00Z"),
  },
];

export function useOrders(): UseOrdersResult {
  const { data, loading, error, refetch } = useApiData<Order[]>(
    () => api.listOrders(),
    MOCK_ORDERS
  );
  return { orders: data ?? MOCK_ORDERS, loading, error, refetch };
}

// ---------------------------------------------------------------------------
// useCustomers
// ---------------------------------------------------------------------------

export interface UseCustomersResult {
  customers: User[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const MOCK_CUSTOMERS: User[] = [
  {
    id: "00000000-0000-0000-0000-000000000010",
    googleId: "google-001",
    email: "sarah.k@example.com",
    name: "Sarah K.",
    isAdmin: false,
    createdAt: new Date("2025-11-01"),
    updatedAt: new Date("2025-11-01"),
  },
  {
    id: "00000000-0000-0000-0000-000000000011",
    googleId: "google-002",
    email: "mike.t@example.com",
    name: "Mike T.",
    isAdmin: false,
    createdAt: new Date("2025-12-15"),
    updatedAt: new Date("2025-12-15"),
  },
  {
    id: "00000000-0000-0000-0000-000000000012",
    googleId: "google-003",
    email: "anna.l@example.com",
    name: "Anna L.",
    isAdmin: false,
    createdAt: new Date("2026-01-03"),
    updatedAt: new Date("2026-01-03"),
  },
];

export function useCustomers(): UseCustomersResult {
  const { data, loading, error, refetch } = useApiData<User[]>(
    () => api.listCustomers(),
    MOCK_CUSTOMERS
  );
  return { customers: data ?? MOCK_CUSTOMERS, loading, error, refetch };
}

// ---------------------------------------------------------------------------
// useSubscriptions
// ---------------------------------------------------------------------------

export interface UseSubscriptionsResult {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "00000000-0000-0000-0000-000000000020",
    userId: "00000000-0000-0000-0000-000000000010",
    status: "active",
    stripeSubscriptionId: "sub_mock_001",
    schedule: {
      days: ["monday", "wednesday", "friday"],
      timeSlot: "08:00-10:00",
      mealsPerDay: 3,
    },
    macroTargets: { calories: 1800, protein: 140, carbs: 180, fat: 60 },
    createdAt: new Date("2025-11-05"),
    updatedAt: new Date("2026-02-01"),
  },
  {
    id: "00000000-0000-0000-0000-000000000021",
    userId: "00000000-0000-0000-0000-000000000011",
    status: "paused",
    stripeSubscriptionId: "sub_mock_002",
    schedule: {
      days: ["tuesday", "thursday", "saturday"],
      timeSlot: "11:00-13:00",
      mealsPerDay: 2,
    },
    macroTargets: { calories: 2400, protein: 180, carbs: 240, fat: 80 },
    createdAt: new Date("2025-12-20"),
    updatedAt: new Date("2026-01-15"),
  },
];

export function useSubscriptions(): UseSubscriptionsResult {
  const { data, loading, error, refetch } = useApiData<Subscription[]>(
    () => api.listSubscriptions(),
    MOCK_SUBSCRIPTIONS
  );
  return { subscriptions: data ?? MOCK_SUBSCRIPTIONS, loading, error, refetch };
}
