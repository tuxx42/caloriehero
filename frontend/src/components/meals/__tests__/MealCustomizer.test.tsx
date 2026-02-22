import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MealCustomizer } from "../MealCustomizer";
import type { Meal, PricingConfig } from "../../../api/types";

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
  price: 200,
  allergens: [],
  dietary_tags: [],
  image_url: null,
  active: true,
  protein_price_per_gram: null,
  carbs_price_per_gram: null,
  fat_price_per_gram: null,
};

const mockPricing: PricingConfig = {
  id: "p1",
  protein_price_per_gram: 3,
  carbs_price_per_gram: 1,
  fat_price_per_gram: 1.5,
};

describe("MealCustomizer", () => {
  const mockOnAdd = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders meal info and base price", () => {
    render(
      <MealCustomizer
        meal={mockMeal}
        pricing={mockPricing}
        onAdd={mockOnAdd}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("Test Meal")).toBeDefined();
    expect(screen.getByText("Base price")).toBeDefined();
    // ฿200 appears in base price and total — use getAllByText
    expect(screen.getAllByText("฿200")).toHaveLength(2);
  });

  it("shows per-gram rates", () => {
    render(
      <MealCustomizer
        meal={mockMeal}
        pricing={mockPricing}
        onAdd={mockOnAdd}
        onClose={mockOnClose}
      />,
    );
    // Rate text is split across text nodes; use textContent matching
    const rateLabels = screen.getAllByText(/add only/);
    expect(rateLabels).toHaveLength(3);  // protein, carbs, fat
  });

  it("calls onAdd with extras when Add to Cart is clicked", () => {
    render(
      <MealCustomizer
        meal={mockMeal}
        pricing={mockPricing}
        onAdd={mockOnAdd}
        onClose={mockOnClose}
      />,
    );

    // Click + on protein (adds 5g)
    const plusButtons = screen.getAllByText("+");
    fireEvent.click(plusButtons[0]); // First + is for protein

    fireEvent.click(screen.getByText("Add to Cart"));
    expect(mockOnAdd).toHaveBeenCalledWith(mockMeal, {
      extraProtein: 5,
      extraCarbs: 0,
      extraFat: 0,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <MealCustomizer
        meal={mockMeal}
        pricing={mockPricing}
        onAdd={mockOnAdd}
        onClose={mockOnClose}
      />,
    );
    fireEvent.click(screen.getByText("✕"));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
