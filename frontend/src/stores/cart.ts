import { create } from "zustand";
import type { Meal } from "../api/types";

export interface CartItem {
  meal: Meal;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (meal: Meal) => void;
  removeItem: (mealId: string) => void;
  updateQuantity: (mealId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  addItem: (meal) =>
    set((state) => {
      const existing = state.items.find((i) => i.meal.id === meal.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.meal.id === meal.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return { items: [...state.items, { meal, quantity: 1 }] };
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
  clearCart: () => set({ items: [] }),
  total: () =>
    get().items.reduce((sum, i) => sum + i.meal.price * i.quantity, 0),
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
