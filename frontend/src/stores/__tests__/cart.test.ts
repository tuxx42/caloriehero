import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "../cart";
import type { PlanContext } from "../cart";
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
  protein_price_per_gram: null,
  carbs_price_per_gram: null,
  fat_price_per_gram: null,
  nutritional_benefits: null,
};

const mockMeal2: Meal = { ...mockMeal, id: "m2", name: "Meal 2", price: 200 };

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      planContexts: [],
      pricingRates: {
        protein_price_per_gram: 3,
        carbs_price_per_gram: 1,
        fat_price_per_gram: 1.5,
      },
    });
  });

  it("starts empty", () => {
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().total()).toBe(0);
    expect(useCartStore.getState().itemCount()).toBe(0);
  });

  it("adds an item with default extras", () => {
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].meal.id).toBe("m1");
    expect(state.items[0].quantity).toBe(1);
    expect(state.items[0].extraProtein).toBe(0);
    expect(state.items[0].extraCarbs).toBe(0);
    expect(state.items[0].extraFat).toBe(0);
    expect(state.items[0].planId).toBe("plan-1");
    expect(state.items[0].id).toBeDefined();
  });

  it("adds an item with extras", () => {
    useCartStore
      .getState()
      .addItem(mockMeal, { extraProtein: 10, extraCarbs: 5, extraFat: 0 }, "plan-1");
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].extraProtein).toBe(10);
    expect(state.items[0].extraCarbs).toBe(5);
    expect(state.items[0].extraFat).toBe(0);
  });

  it("increments quantity on duplicate add within same plan", () => {
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it("creates separate items for same meal with different extras", () => {
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    useCartStore
      .getState()
      .addItem(mockMeal, { extraProtein: 10, extraCarbs: 0, extraFat: 0 }, "plan-1");
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(2);
  });

  it("creates separate items for same meal in different plans", () => {
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    useCartStore.getState().addItem(mockMeal, undefined, "plan-2");
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(2);
    expect(state.items[0].planId).toBe("plan-1");
    expect(state.items[1].planId).toBe("plan-2");
  });

  it("deduplicates within same plan", () => {
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.items[0].planId).toBe("plan-1");
  });

  it("removes an item by item id", () => {
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    const itemId = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(itemId);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("updates quantity by item id", () => {
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    const itemId = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(itemId, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("removes item when quantity set to 0", () => {
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    const itemId = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(itemId, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("calculates total correctly without extras", () => {
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    useCartStore.getState().addItem(mockMeal2, undefined, "plan-1");
    const item1Id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(item1Id, 2);
    // 159*2 + 200*1 = 518
    expect(useCartStore.getState().total()).toBe(518);
  });

  it("calculates total correctly with extras", () => {
    useCartStore
      .getState()
      .addItem(mockMeal, { extraProtein: 10, extraCarbs: 0, extraFat: 0 }, "plan-1");
    // unit_price = 159 + 10*3 = 189, quantity=1
    expect(useCartStore.getState().total()).toBe(189);
  });

  it("calculates item price correctly", () => {
    useCartStore
      .getState()
      .addItem(mockMeal, { extraProtein: 10, extraCarbs: 20, extraFat: 5 }, "plan-1");
    const item = useCartStore.getState().items[0];
    // 159 + (10*3) + (20*1) + (5*1.5) = 159 + 30 + 20 + 7.5 = 216.5
    expect(useCartStore.getState().itemPrice(item)).toBe(216.5);
  });

  it("calculates item count correctly", () => {
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    useCartStore.getState().addItem(mockMeal2, undefined, "plan-1");
    const item1Id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(item1Id, 3);
    // 3 + 1 = 4
    expect(useCartStore.getState().itemCount()).toBe(4);
  });

  it("clears cart", () => {
    useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
    useCartStore.getState().addItem(mockMeal2, undefined, "plan-1");
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("sets pricing rates", () => {
    useCartStore.getState().setPricingRates({
      protein_price_per_gram: 5,
      carbs_price_per_gram: 2,
      fat_price_per_gram: 3,
    });
    expect(useCartStore.getState().pricingRates).toEqual({
      protein_price_per_gram: 5,
      carbs_price_per_gram: 2,
      fat_price_per_gram: 3,
    });
  });

  it("calculates unit price with negative extras (no reduction)", () => {
    useCartStore
      .getState()
      .addItem(mockMeal, { extraProtein: -10, extraCarbs: -20, extraFat: -5 }, "plan-1");
    const item = useCartStore.getState().items[0];
    // Negative extras don't reduce price: 159 + 0 + 0 + 0 = 159
    expect(useCartStore.getState().itemPrice(item)).toBe(159);
  });

  it("calculates unit price with mixed positive and negative extras", () => {
    useCartStore
      .getState()
      .addItem(mockMeal, { extraProtein: 10, extraCarbs: -15, extraFat: 5 }, "plan-1");
    const item = useCartStore.getState().items[0];
    // 159 + max(0,10)*3 + max(0,-15)*1 + max(0,5)*1.5 = 159 + 30 + 0 + 7.5 = 196.5
    expect(useCartStore.getState().itemPrice(item)).toBe(196.5);
  });

  describe("planContexts", () => {
    const mockPlanContext: PlanContext = {
      id: "plan-1",
      planType: "multi",
      numDays: 7,
      targetMacros: { calories: 2200, protein: 165, carbs: 220, fat: 73 },
      dailySummaries: [
        {
          day: 1,
          target_macros: { calories: 2200, protein: 165, carbs: 220, fat: 73 },
          actual_macros: { calories: 2150, protein: 160, carbs: 210, fat: 70 },
        },
      ],
      totalScore: 0.92,
    };

    const mockPlanContext2: PlanContext = {
      id: "plan-2",
      planType: "single",
      numDays: 1,
      targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
      dailySummaries: [
        {
          day: 1,
          target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          actual_macros: { calories: 1950, protein: 145, carbs: 195, fat: 63 },
        },
      ],
      totalScore: 0.95,
    };

    it("starts with empty planContexts", () => {
      expect(useCartStore.getState().planContexts).toEqual([]);
    });

    it("adds plan context", () => {
      useCartStore.getState().addPlanContext(mockPlanContext);
      expect(useCartStore.getState().planContexts).toEqual([mockPlanContext]);
    });

    it("accumulates multiple plan contexts", () => {
      useCartStore.getState().addPlanContext(mockPlanContext);
      useCartStore.getState().addPlanContext(mockPlanContext2);
      expect(useCartStore.getState().planContexts).toHaveLength(2);
      expect(useCartStore.getState().planContexts[0]).toEqual(mockPlanContext);
      expect(useCartStore.getState().planContexts[1]).toEqual(mockPlanContext2);
    });

    it("clears all plan contexts on clearCart", () => {
      useCartStore.getState().addPlanContext(mockPlanContext);
      useCartStore.getState().addPlanContext(mockPlanContext2);
      useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
      useCartStore.getState().clearCart();
      expect(useCartStore.getState().planContexts).toEqual([]);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("retains plan contexts when removing an item", () => {
      useCartStore.getState().addPlanContext(mockPlanContext);
      useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
      useCartStore.getState().addItem(mockMeal2, undefined, "plan-1");
      const item1Id = useCartStore.getState().items[0].id;
      useCartStore.getState().removeItem(item1Id);
      expect(useCartStore.getState().planContexts).toEqual([mockPlanContext]);
      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  describe("removePlan", () => {
    it("removes plan context and its items", () => {
      useCartStore.getState().addItem(mockMeal, undefined, "plan-1");
      useCartStore.getState().addItem(mockMeal2, undefined, "plan-1");
      useCartStore.getState().addItem(mockMeal, undefined, "plan-2");
      useCartStore.getState().addPlanContext({
        id: "plan-1",
        planType: "single",
        numDays: 1,
        targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
        dailySummaries: [{
          day: 1,
          target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          actual_macros: { calories: 1950, protein: 145, carbs: 195, fat: 63 },
        }],
        totalScore: 0.9,
      });
      useCartStore.getState().addPlanContext({
        id: "plan-2",
        planType: "single",
        numDays: 1,
        targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
        dailySummaries: [{
          day: 1,
          target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          actual_macros: { calories: 1950, protein: 145, carbs: 195, fat: 63 },
        }],
        totalScore: 0.85,
      });

      useCartStore.getState().removePlan("plan-1");

      expect(useCartStore.getState().planContexts).toHaveLength(1);
      expect(useCartStore.getState().planContexts[0].id).toBe("plan-2");
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].planId).toBe("plan-2");
    });
  });
});
