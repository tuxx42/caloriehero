import { api } from "../client";
import type { Order, PaymentIntentResponse } from "../types";

export function createOrder(data: {
  items: Array<{
    meal_id: string;
    quantity: number;
    extra_protein?: number;
    extra_carbs?: number;
    extra_fat?: number;
  }>;
  type?: string;
  delivery_slot_id?: string;
  delivery_address?: string;
}): Promise<Order> {
  return api.post<Order>("/orders", data);
}

export function listOrders(): Promise<Order[]> {
  return api.get<Order[]>("/orders");
}

export function getOrder(id: string): Promise<Order> {
  return api.get<Order>(`/orders/${id}`);
}

export function payOrder(id: string): Promise<PaymentIntentResponse> {
  return api.post<PaymentIntentResponse>(`/orders/${id}/pay`);
}
