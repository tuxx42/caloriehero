import { create } from "zustand";
import type { MacroTargets, Meal } from "../api/types";

export interface MacroExtras {
  extraProtein: number;
  extraCarbs: number;
  extraFat: number;
}

export interface CartItem {
  meal: Meal;
  quantity: number;
  extraProtein: number;
  extraCarbs: number;
  extraFat: number;
}

export interface DayMacroSummary {
  day: number;
  target_macros: MacroTargets;
  actual_macros: MacroTargets;
}

export interface PlanContext {
  planType: "single" | "multi";
  numDays: number;
  targetMacros: MacroTargets;
  dailySummaries: DayMacroSummary[];
  totalScore: number;
}

interface PricingRates {
  protein_price_per_gram: number;
  carbs_price_per_gram: number;
  fat_price_per_gram: number;
}

interface CartState {
  items: CartItem[];
  planContext: PlanContext | null;
  pricingRates: PricingRates | null;
  setPricingRates: (rates: PricingRates) => void;
  setPlanContext: (ctx: PlanContext) => void;
  addItem: (meal: Meal, extras?: MacroExtras) => void;
  removeItem: (mealId: string) => void;
  updateQuantity: (mealId: string, quantity: number) => void;
  clearCart: () => void;
  itemPrice: (item: CartItem) => number;
  total: () => number;
  itemCount: () => number;
}

function calcUnitPrice(item: CartItem, rates: PricingRates | null): number {
  const proteinRate =
    item.meal.protein_price_per_gram ?? rates?.protein_price_per_gram ?? 3;
  const carbsRate =
    item.meal.carbs_price_per_gram ?? rates?.carbs_price_per_gram ?? 1;
  const fatRate =
    item.meal.fat_price_per_gram ?? rates?.fat_price_per_gram ?? 1.5;

  return (
    item.meal.price +
    Math.max(0, item.extraProtein) * proteinRate +
    Math.max(0, item.extraCarbs) * carbsRate +
    Math.max(0, item.extraFat) * fatRate
  );
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  planContext: null,
  pricingRates: null,
  setPricingRates: (rates) => set({ pricingRates: rates }),
  setPlanContext: (ctx) => set({ planContext: ctx }),
  addItem: (meal, extras) =>
    set((state) => {
      const ep = extras?.extraProtein ?? 0;
      const ec = extras?.extraCarbs ?? 0;
      const ef = extras?.extraFat ?? 0;

      // Find existing item with same meal AND same extras
      const existing = state.items.find(
        (i) =>
          i.meal.id === meal.id &&
          i.extraProtein === ep &&
          i.extraCarbs === ec &&
          i.extraFat === ef,
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i === existing ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            meal,
            quantity: 1,
            extraProtein: ep,
            extraCarbs: ec,
            extraFat: ef,
          },
        ],
      };
    }),
  removeItem: (mealId) =>
    set((state) => ({
      items: state.items.filter((i) => i.meal.id !== mealId),
    })),
  updateQuantity: (mealId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.meal.id !== mealId) };
      }
      return {
        items: state.items.map((i) =>
          i.meal.id === mealId ? { ...i, quantity } : i,
        ),
      };
    }),
  clearCart: () => set({ items: [], planContext: null }),
  itemPrice: (item) => calcUnitPrice(item, get().pricingRates),
  total: () =>
    get().items.reduce(
      (sum, i) => sum + calcUnitPrice(i, get().pricingRates) * i.quantity,
      0,
    ),
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
