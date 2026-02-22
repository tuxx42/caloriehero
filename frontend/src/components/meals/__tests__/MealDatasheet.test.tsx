import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MealDatasheet } from "../MealDatasheet";
import type { Meal, MacroTargets } from "../../../api/types";

const mockMeal: Meal = {
  id: "m1",
  name: "Grilled Chicken Breast",
  description: "Herb-marinated chicken breast with broccoli and brown rice.",
  category: "lunch",
  calories: 420,
  protein: 48,
  carbs: 32,
  fat: 10,
  fiber: 4,
  sugar: 2,
  serving_size: "350g",
  price: 180,
  allergens: ["dairy", "wheat"],
  dietary_tags: ["high_protein", "gluten_free"],
  image_url: null,
  active: true,
  protein_price_per_gram: null,
  carbs_price_per_gram: null,
  fat_price_per_gram: null,
  nutritional_benefits:
    "Excellent source of lean protein for muscle repair. Broccoli provides vitamin C.",
};

const mockTargets: MacroTargets = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

describe("MealDatasheet", () => {
  const mockOnClose = vi.fn();

  it("renders meal name and description", () => {
    render(
      <MealDatasheet
        meal={mockMeal}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("Grilled Chicken Breast")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Herb-marinated chicken breast with broccoli and brown rice.",
      ),
    ).toBeInTheDocument();
  });

  it("renders serving size and category", () => {
    render(
      <MealDatasheet
        meal={mockMeal}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("350g")).toBeInTheDocument();
    expect(screen.getByText("lunch")).toBeInTheDocument();
  });

  it("renders radar chart SVG", () => {
    render(
      <MealDatasheet
        meal={mockMeal}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByRole("img", { name: "Macro radar chart" })).toBeInTheDocument();
  });

  it("shows % daily value rows for each macro", () => {
    render(
      <MealDatasheet
        meal={mockMeal}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("% Daily Values")).toBeInTheDocument();
    // Check that percentage labels appear
    // Calories: 420/2000 = 21%
    expect(screen.getByText("(21%)")).toBeInTheDocument();
    // Protein: 48/150 = 32%
    expect(screen.getByText("(32%)")).toBeInTheDocument();
    // Carbs: 32/200 = 16%
    expect(screen.getByText("(16%)")).toBeInTheDocument();
    // Fat: 10/65 = 15%
    expect(screen.getByText("(15%)")).toBeInTheDocument();
  });

  it("shows allergen badges", () => {
    render(
      <MealDatasheet
        meal={mockMeal}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("Allergens")).toBeInTheDocument();
    expect(screen.getByText("Dairy")).toBeInTheDocument();
    expect(screen.getByText("Wheat")).toBeInTheDocument();
  });

  it("shows dietary tag badges", () => {
    render(
      <MealDatasheet
        meal={mockMeal}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("Dietary Tags")).toBeInTheDocument();
    expect(screen.getByText("High Protein")).toBeInTheDocument();
    expect(screen.getByText("Gluten Free")).toBeInTheDocument();
  });

  it("shows nutritional benefits text", () => {
    render(
      <MealDatasheet
        meal={mockMeal}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("Nutritional Benefits")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Excellent source of lean protein for muscle repair. Broccoli provides vitamin C.",
      ),
    ).toBeInTheDocument();
  });

  it("hides nutritional benefits when null", () => {
    render(
      <MealDatasheet
        meal={{ ...mockMeal, nutritional_benefits: null }}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    expect(screen.queryByText("Nutritional Benefits")).not.toBeInTheDocument();
  });

  it("hides allergens section when empty", () => {
    render(
      <MealDatasheet
        meal={{ ...mockMeal, allergens: [] }}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    expect(screen.queryByText("Allergens")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <MealDatasheet
        meal={mockMeal}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    fireEvent.click(screen.getByText("Close"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when X button is clicked", () => {
    render(
      <MealDatasheet
        meal={mockMeal}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    fireEvent.click(screen.getByText("✕"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows meal price", () => {
    render(
      <MealDatasheet
        meal={mockMeal}
        targetMacros={mockTargets}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("฿180")).toBeInTheDocument();
  });
});
