import { create } from "zustand";

export interface CartMeal {
  name: string;
  price: number;
  calories: number;
}

export interface CartItem {
  mealId: string;
  meal: CartMeal;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  addItem: (mealId: string, meal: CartMeal) => void;
  removeItem: (mealId: string) => void;
  updateQuantity: (mealId: string, quantity: number) => void;
  clearCart: () => void;
}

function computeTotals(items: CartItem[]): { totalPrice: number; totalItems: number } {
  return items.reduce(
    (acc, item) => ({
      totalPrice: acc.totalPrice + item.meal.price * item.quantity,
      totalItems: acc.totalItems + item.quantity,
    }),
    { totalPrice: 0, totalItems: 0 }
  );
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],
  totalPrice: 0,
  totalItems: 0,

  addItem: (mealId: string, meal: CartMeal) => {
    set((state) => {
      const existing = state.items.find((i) => i.mealId === mealId);
      let updatedItems: CartItem[];

      if (existing) {
        updatedItems = state.items.map((i) =>
          i.mealId === mealId ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        updatedItems = [...state.items, { mealId, meal, quantity: 1 }];
      }

      return { items: updatedItems, ...computeTotals(updatedItems) };
    });
  },

  removeItem: (mealId: string) => {
    set((state) => {
      const updatedItems = state.items.filter((i) => i.mealId !== mealId);
      return { items: updatedItems, ...computeTotals(updatedItems) };
    });
  },

  updateQuantity: (mealId: string, quantity: number) => {
    set((state) => {
      let updatedItems: CartItem[];
      if (quantity <= 0) {
        updatedItems = state.items.filter((i) => i.mealId !== mealId);
      } else {
        updatedItems = state.items.map((i) =>
          i.mealId === mealId ? { ...i, quantity } : i
        );
      }
      return { items: updatedItems, ...computeTotals(updatedItems) };
    });
  },

  clearCart: () => {
    set({ items: [], totalPrice: 0, totalItems: 0 });
  },
}));
