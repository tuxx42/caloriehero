import { api } from "../client";
import type { DailyPlan, ScoredMeal, SlotAlternative } from "../types";

export function matchMeals(limit = 10): Promise<ScoredMeal[]> {
  return api.post<ScoredMeal[]>(`/matching/meals?limit=${limit}`);
}

export function generatePlan(): Promise<DailyPlan> {
  return api.post<DailyPlan>("/matching/plan");
}

export function generatePlans(count = 3): Promise<DailyPlan[]> {
  return api.post<DailyPlan[]>(`/matching/plans?count=${count}`);
}

export function getSlotAlternatives(
  slot: string,
  excludeMealIds: string[],
  limit = 5,
): Promise<SlotAlternative[]> {
  return api.post<SlotAlternative[]>("/matching/plan/alternatives", {
    slot,
    exclude_meal_ids: excludeMealIds,
    limit,
  });
}

export function recalculatePlan(
  items: { slot: string; meal_id: string }[],
): Promise<DailyPlan> {
  return api.post<DailyPlan>("/matching/plan/recalculate", { items });
}
