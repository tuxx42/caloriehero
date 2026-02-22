import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { CartPage } from "../Cart";
import { useCartStore } from "../../stores/cart";
import type { Meal } from "../../api/types";

const mockMeal: Meal = {
  id: "m1",
  name: "Grilled Chicken",
  description: "Grilled chicken breast",
  category: "lunch",
  calories: 450,
  protein: 42,
  carbs: 30,
  fat: 12,
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

const mockMeal2: Meal = { ...mockMeal, id: "m2", name: "Salmon Bowl", price: 200 };

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("CartPage", () => {
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

  it("shows empty state with link to plan generator", () => {
    renderWithRouter(<CartPage />);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByText("Generate a Plan")).toBeInTheDocument();
  });

  it("shows cart items when items exist", () => {
    useCartStore.setState({
      items: [
        {
          id: "item-1",
          meal: mockMeal,
          quantity: 2,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
          planId: "plan-1",
        },
      ],
      planContexts: [
        {
          id: "plan-1",
          planType: "single",
          numDays: 1,
          targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          dailySummaries: [{
            day: 1,
            target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
            actual_macros: { calories: 1950, protein: 145, carbs: 195, fat: 63 },
          }],
          totalScore: 0.95,
        },
      ],
    });
    renderWithRouter(<CartPage />);
    expect(screen.getByText("Grilled Chicken")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows total price", () => {
    useCartStore.setState({
      items: [
        {
          id: "item-1",
          meal: mockMeal,
          quantity: 2,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
          planId: "plan-1",
        },
      ],
      planContexts: [
        {
          id: "plan-1",
          planType: "single",
          numDays: 1,
          targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          dailySummaries: [{
            day: 1,
            target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
            actual_macros: { calories: 1950, protein: 145, carbs: 195, fat: 63 },
          }],
          totalScore: 0.95,
        },
      ],
    });
    renderWithRouter(<CartPage />);
    // 159 * 2 = 318
    expect(screen.getByText("฿318")).toBeInTheDocument();
  });

  it("shows checkout link", () => {
    useCartStore.setState({
      items: [
        {
          id: "item-1",
          meal: mockMeal,
          quantity: 1,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
          planId: "plan-1",
        },
      ],
      planContexts: [
        {
          id: "plan-1",
          planType: "single",
          numDays: 1,
          targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          dailySummaries: [{
            day: 1,
            target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
            actual_macros: { calories: 1950, protein: 145, carbs: 195, fat: 63 },
          }],
          totalScore: 0.95,
        },
      ],
    });
    renderWithRouter(<CartPage />);
    expect(screen.getByText("Proceed to Checkout")).toBeInTheDocument();
  });

  it("shows clear all button", () => {
    useCartStore.setState({
      items: [
        {
          id: "item-1",
          meal: mockMeal,
          quantity: 1,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
          planId: "plan-1",
        },
      ],
      planContexts: [
        {
          id: "plan-1",
          planType: "single",
          numDays: 1,
          targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          dailySummaries: [{
            day: 1,
            target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
            actual_macros: { calories: 1950, protein: 145, carbs: 195, fat: 63 },
          }],
          totalScore: 0.95,
        },
      ],
    });
    renderWithRouter(<CartPage />);
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("displays meal calories and unit price", () => {
    useCartStore.setState({
      items: [
        {
          id: "item-1",
          meal: mockMeal,
          quantity: 1,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
          planId: "plan-1",
        },
      ],
      planContexts: [
        {
          id: "plan-1",
          planType: "single",
          numDays: 1,
          targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          dailySummaries: [{
            day: 1,
            target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
            actual_macros: { calories: 1950, protein: 145, carbs: 195, fat: 63 },
          }],
          totalScore: 0.95,
        },
      ],
    });
    renderWithRouter(<CartPage />);
    expect(screen.getByText("450 cal · ฿159")).toBeInTheDocument();
  });

  it("displays negative extras correctly", () => {
    useCartStore.setState({
      items: [
        {
          id: "item-1",
          meal: mockMeal,
          quantity: 1,
          extraProtein: 5,
          extraCarbs: -10,
          extraFat: 0,
          planId: "plan-1",
        },
      ],
      planContexts: [
        {
          id: "plan-1",
          planType: "single",
          numDays: 1,
          targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          dailySummaries: [{
            day: 1,
            target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
            actual_macros: { calories: 1950, protein: 145, carbs: 195, fat: 63 },
          }],
          totalScore: 0.95,
        },
      ],
    });
    renderWithRouter(<CartPage />);
    expect(screen.getByText("+5g P, -10g C")).toBeInTheDocument();
  });

  it("shows plan summary badge when planContexts has entries", () => {
    useCartStore.setState({
      items: [
        {
          id: "item-1",
          meal: mockMeal,
          quantity: 1,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
          planId: "plan-1",
        },
      ],
      planContexts: [
        {
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
        },
      ],
    });
    renderWithRouter(<CartPage />);
    expect(screen.getByTestId("plan-summary-badge")).toBeInTheDocument();
    expect(screen.getByText("7-Day Plan")).toBeInTheDocument();
    expect(screen.getByText("92% match")).toBeInTheDocument();
  });

  it("groups items under their plan", () => {
    useCartStore.setState({
      items: [
        {
          id: "item-1",
          meal: mockMeal,
          quantity: 1,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
          planId: "plan-1",
        },
        {
          id: "item-2",
          meal: mockMeal2,
          quantity: 1,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
          planId: "plan-2",
        },
      ],
      planContexts: [
        {
          id: "plan-1",
          planType: "single",
          numDays: 1,
          targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          dailySummaries: [{
            day: 1,
            target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
            actual_macros: { calories: 1950, protein: 145, carbs: 195, fat: 63 },
          }],
          totalScore: 0.95,
        },
        {
          id: "plan-2",
          planType: "multi",
          numDays: 7,
          targetMacros: { calories: 2200, protein: 165, carbs: 220, fat: 73 },
          dailySummaries: [{
            day: 1,
            target_macros: { calories: 2200, protein: 165, carbs: 220, fat: 73 },
            actual_macros: { calories: 2150, protein: 160, carbs: 210, fat: 70 },
          }],
          totalScore: 0.88,
        },
      ],
    });
    renderWithRouter(<CartPage />);
    expect(screen.getByText("Daily Plan")).toBeInTheDocument();
    expect(screen.getByText("7-Day Plan")).toBeInTheDocument();
    expect(screen.getByText("Grilled Chicken")).toBeInTheDocument();
    expect(screen.getByText("Salmon Bowl")).toBeInTheDocument();
  });

  it("removes a plan and its items when remove button is clicked", () => {
    useCartStore.setState({
      items: [
        {
          id: "item-1",
          meal: mockMeal,
          quantity: 1,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
          planId: "plan-1",
        },
        {
          id: "item-2",
          meal: mockMeal2,
          quantity: 1,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
          planId: "plan-2",
        },
      ],
      planContexts: [
        {
          id: "plan-1",
          planType: "single",
          numDays: 1,
          targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          dailySummaries: [{
            day: 1,
            target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
            actual_macros: { calories: 1950, protein: 145, carbs: 195, fat: 63 },
          }],
          totalScore: 0.95,
        },
        {
          id: "plan-2",
          planType: "multi",
          numDays: 7,
          targetMacros: { calories: 2200, protein: 165, carbs: 220, fat: 73 },
          dailySummaries: [{
            day: 1,
            target_macros: { calories: 2200, protein: 165, carbs: 220, fat: 73 },
            actual_macros: { calories: 2150, protein: 160, carbs: 210, fat: 70 },
          }],
          totalScore: 0.88,
        },
      ],
    });
    renderWithRouter(<CartPage />);

    // Remove the first plan (Daily Plan)
    const removeBtn = screen.getByLabelText("Remove daily plan");
    fireEvent.click(removeBtn);

    // Plan 1 items should be gone, plan 2 items remain
    expect(screen.queryByText("Grilled Chicken")).not.toBeInTheDocument();
    expect(screen.getByText("Salmon Bowl")).toBeInTheDocument();
    expect(screen.getByText("7-Day Plan")).toBeInTheDocument();
    expect(screen.queryByText("Daily Plan")).not.toBeInTheDocument();
  });
});
