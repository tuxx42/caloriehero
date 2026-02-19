import type {
  Meal,
  Order,
  OrderStatus,
  User,
  Subscription,
  DeliveryZone,
  DeliverySlot,
} from "@caloriehero/shared-types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ---------------------------------------------------------------------------
// Token management — simple module-level storage for admin token
// ---------------------------------------------------------------------------

let _adminToken: string | null = null;

export function setAdminToken(token: string) {
  _adminToken = token;
}

export function getAdminToken(): string | null {
  return _adminToken;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

interface ApiError extends Error {
  status: number;
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const authToken = token ?? _adminToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const err = new Error(
      `API ${init.method ?? "GET"} ${path} failed: ${response.status} ${response.statusText}`
    ) as ApiError;
    err.status = response.status;
    throw err;
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Meals
// ---------------------------------------------------------------------------

export type CreateMealData = Omit<Meal, "id" | "createdAt" | "updatedAt">;
export type UpdateMealData = Partial<CreateMealData>;

export async function listMeals(token?: string): Promise<Meal[]> {
  const data = await apiFetch<{ items: Meal[]; total: number; page: number; pageSize: number }>(
    "/api/v1/meals",
    {},
    token
  );
  return data.items;
}

export async function createMeal(
  data: CreateMealData,
  token?: string
): Promise<Meal> {
  return apiFetch<Meal>(
    "/api/v1/meals",
    { method: "POST", body: JSON.stringify(data) },
    token
  );
}

export async function updateMeal(
  id: string,
  data: UpdateMealData,
  token?: string
): Promise<Meal> {
  return apiFetch<Meal>(
    `/api/v1/meals/${id}`,
    { method: "PUT", body: JSON.stringify(data) },
    token
  );
}

export async function deleteMeal(
  id: string,
  token?: string
): Promise<void> {
  return apiFetch<void>(
    `/api/v1/meals/${id}`,
    { method: "DELETE" },
    token
  );
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function listOrders(token?: string): Promise<Order[]> {
  const data = await apiFetch<{ orders: Order[] }>(
    "/api/v1/orders",
    {},
    token
  );
  return data.orders;
}

export async function getOrder(
  id: string,
  token?: string
): Promise<Order> {
  return apiFetch<Order>(`/api/v1/orders/${id}`, {}, token);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  token?: string
): Promise<Order> {
  return apiFetch<Order>(
    `/api/v1/orders/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
    token
  );
}

// ---------------------------------------------------------------------------
// Customers (admin endpoint)
// ---------------------------------------------------------------------------

export async function listCustomers(token?: string): Promise<User[]> {
  const data = await apiFetch<{ items: User[]; total: number; page: number; pageSize: number } | User[]>(
    "/api/v1/users",
    {},
    token
  );
  // Handle both paginated and plain array responses
  if (Array.isArray(data)) return data;
  return data.items;
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export async function listSubscriptions(token?: string): Promise<Subscription[]> {
  const data = await apiFetch<{
    items: Subscription[];
    total: number;
    page: number;
    pageSize: number;
  }>("/api/v1/subscriptions", {}, token);
  return data.items;
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export async function listDeliveryZones(token?: string): Promise<DeliveryZone[]> {
  return apiFetch<DeliveryZone[]>("/api/v1/delivery/zones", {}, token);
}

export async function listDeliverySlots(
  date: string,
  token?: string
): Promise<DeliverySlot[]> {
  return apiFetch<DeliverySlot[]>(
    `/api/v1/delivery/slots?date=${encodeURIComponent(date)}`,
    {},
    token
  );
}

// ---------------------------------------------------------------------------
// SSE
// ---------------------------------------------------------------------------

export function connectOrderSSE(
  orderId: string,
  token?: string
): EventSource {
  const authToken = token ?? _adminToken;
  const url = new URL(`${BASE_URL}/api/v1/sse/orders/${orderId}`);
  if (authToken) {
    // EventSource doesn't support custom headers — pass token as query param
    url.searchParams.set("token", authToken);
  }
  return new EventSource(url.toString());
}
