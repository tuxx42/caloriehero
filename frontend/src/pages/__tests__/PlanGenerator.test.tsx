import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { PlanGeneratorPage } from "../PlanGenerator";
import { useCartStore } from "../../stores/cart";
import type { DailyPlan, Meal } from "../../api/types";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockMeal: Meal = {
  id: "meal-1",
  name: "Chicken Rice",
  description: "Grilled chicken with rice",
  category: "lunch",
  calories: 500,
  protein: 40,
  carbs: 50,
  fat: 12,
  fiber: null,
  sugar: null,
  serving_size: "400g",
  price: 159,
  allergens: [],
  dietary_tags: [],
  image_url: null,
  active: true,
  protein_price_per_gram: null,
  carbs_price_per_gram: null,
  fat_price_per_gram: null,
};

const mockPlan: DailyPlan = {
  id: "plan-1",
  date: "2026-02-22",
  total_score: 0.92,
  actual_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
  target_macros: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
  total_extra_price: 15,
  items: [
    {
      slot: "breakfast",
      meal_id: "meal-b",
      meal_name: "Pancakes",
      score: 0.97,
      slot_targets: { calories: 500, protein: 37.5, carbs: 50, fat: 16.25 },
      extra_protein: 5,
      extra_carbs: -10,
      extra_fat: 0,
      extra_price: 15,
      meal: { ...mockMeal, id: "meal-b", name: "Pancakes", price: 149 },
    },
    {
      slot: "lunch",
      meal_id: "meal-l",
      meal_name: "Chicken",
      score: 0.95,
      slot_targets: { calories: 700, protein: 52.5, carbs: 70, fat: 22.75 },
      extra_protein: 0,
      extra_carbs: 0,
      extra_fat: 0,
      extra_price: 0,
      meal: { ...mockMeal, id: "meal-l", name: "Chicken" },
    },
    {
      slot: "dinner",
      meal_id: "meal-d",
      meal_name: "Salmon",
      score: 0.9,
      slot_targets: { calories: 600, protein: 45, carbs: 60, fat: 19.5 },
      extra_protein: -5,
      extra_carbs: 8,
      extra_fat: 0,
      extra_price: 8,
      meal: { ...mockMeal, id: "meal-d", name: "Salmon", price: 189 },
    },
    {
      slot: "snack",
      meal_id: "meal-s",
      meal_name: "Bar",
      score: 0.85,
      slot_targets: { calories: 200, protein: 15, carbs: 20, fat: 6.5 },
      extra_protein: 0,
      extra_carbs: 0,
      extra_fat: 0,
      extra_price: 0,
      meal: { ...mockMeal, id: "meal-s", name: "Bar", price: 69 },
    },
  ],
};

vi.mock("../../api/endpoints/matching", () => ({
  generatePlan: vi.fn(),
  recalculatePlan: vi.fn(),
  getSlotAlternatives: vi.fn(),
}));

import { generatePlan } from "../../api/endpoints/matching";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("PlanGeneratorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [], pricingRates: null });
  });

  it("shows generate button initially", () => {
    renderWithRouter(<PlanGeneratorPage />);
    expect(screen.getByText("Generate Plan")).toBeInTheDocument();
  });

  it("shows meal slots after generation", async () => {
    vi.mocked(generatePlan).mockResolvedValue(mockPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));
    await waitFor(() => {
      expect(screen.getByText("Pancakes")).toBeInTheDocument();
    });

    expect(screen.getByText("Chicken")).toBeInTheDocument();
    expect(screen.getByText("Salmon")).toBeInTheDocument();
    expect(screen.getByText("Bar")).toBeInTheDocument();
  });

  it("shows swap button on each slot card", async () => {
    vi.mocked(generatePlan).mockResolvedValue(mockPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));
    await waitFor(() => {
      expect(screen.getByText("Pancakes")).toBeInTheDocument();
    });

    const swapButtons = screen.getAllByText("Swap");
    expect(swapButtons).toHaveLength(4);
  });

  it("adds plan items to cart", async () => {
    vi.mocked(generatePlan).mockResolvedValue(mockPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));
    await waitFor(() => {
      expect(screen.getByText("Add Plan to Cart")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Plan to Cart"));

    expect(useCartStore.getState().items).toHaveLength(4);
    const firstItem = useCartStore.getState().items[0];
    expect(firstItem.meal.id).toBe("meal-b");
    expect(mockNavigate).toHaveBeenCalledWith("/cart");
  });

  it("shows positive and negative extras on plan items", async () => {
    vi.mocked(generatePlan).mockResolvedValue(mockPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));
    await waitFor(() => {
      expect(screen.getByText("Pancakes")).toBeInTheDocument();
    });

    // Breakfast has +5g P, -10g C
    expect(screen.getByText("+5g P, -10g C")).toBeInTheDocument();
    // Dinner has -5g P, +8g C
    expect(screen.getByText("-5g P, +8g C")).toBeInTheDocument();
  });

  it("shows total plan price including extras", async () => {
    vi.mocked(generatePlan).mockResolvedValue(mockPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));
    await waitFor(() => {
      // Total = 149 + 159 + 189 + 69 + 15 (total_extra_price) = 581
      expect(screen.getByText("฿581")).toBeInTheDocument();
    });
  });
});
