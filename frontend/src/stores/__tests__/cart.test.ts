import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "../cart";
import type { Meal } from "../../api/types";

const mockMeal: Meal = {
  id: "m1",
  name: "Test Meal",
  description: "A test meal",
  category: "lunch",
  calories: 500,
  protein: 40,
  carbs: 45,
  fat: 15,
  fiber: null,
  sugar: null,
  serving_size: "350g",
  price: 159,
  allergens: [],
  dietary_tags: [],
  image_url: null,
  active: true,
};

const mockMeal2: Meal = { ...mockMeal, id: "m2", name: "Meal 2", price: 200 };

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("starts empty", () => {
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().total()).toBe(0);
    expect(useCartStore.getState().itemCount()).toBe(0);
  });

  it("adds an item", () => {
    useCartStore.getState().addItem(mockMeal);
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].meal.id).toBe("m1");
    expect(state.items[0].quantity).toBe(1);
  });

  it("increments quantity on duplicate add", () => {
    useCartStore.getState().addItem(mockMeal);
    useCartStore.getState().addItem(mockMeal);
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it("removes an item", () => {
    useCartStore.getState().addItem(mockMeal);
    useCartStore.getState().removeItem("m1");
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("updates quantity", () => {
    useCartStore.getState().addItem(mockMeal);
    useCartStore.getState().updateQuantity("m1", 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("removes item when quantity set to 0", () => {
    useCartStore.getState().addItem(mockMeal);
    useCartStore.getState().updateQuantity("m1", 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("calculates total correctly", () => {
    useCartStore.getState().addItem(mockMeal);
    useCartStore.getState().addItem(mockMeal2);
    useCartStore.getState().updateQuantity("m1", 2);
    // 159*2 + 200*1 = 518
    expect(useCartStore.getState().total()).toBe(518);
  });

  it("calculates item count correctly", () => {
    useCartStore.getState().addItem(mockMeal);
    useCartStore.getState().addItem(mockMeal2);
    useCartStore.getState().updateQuantity("m1", 3);
    // 3 + 1 = 4
    expect(useCartStore.getState().itemCount()).toBe(4);
  });

  it("clears cart", () => {
    useCartStore.getState().addItem(mockMeal);
    useCartStore.getState().addItem(mockMeal2);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
