import { api } from "../client";
import type { Meal } from "../types";

export function listMeals(category?: string): Promise<Meal[]> {
  const params = category ? `?category=${category}` : "";
  return api.get<Meal[]>(`/meals${params}`);
}

export function getMeal(id: string): Promise<Meal> {
  return api.get<Meal>(`/meals/${id}`);
}
