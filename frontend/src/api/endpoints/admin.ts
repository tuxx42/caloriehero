import { api } from "../client";

export interface DashboardStats {
  total_users: number;
  total_orders: number;
  total_meals: number;
  active_subscriptions: number;
  revenue: number;
  orders_by_status: Record<string, number>;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  status: string;
  total: number;
  type: string;
  items_count: number;
  created_at: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string | null;
}

export function getDashboardStats() {
  return api.get<DashboardStats>("/admin/stats");
}

export function listAllOrders() {
  return api.get<AdminOrder[]>("/admin/orders");
}

export function listAllUsers() {
  return api.get<AdminUser[]>("/admin/users");
}
