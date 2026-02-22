import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { PlanGeneratorPage } from "../PlanGenerator";
import { useCartStore } from "../../stores/cart";
import type { DailyPlan, Meal, MultiDayPlan } from "../../api/types";

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
  nutritional_benefits: null,
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

const mockMultiDayPlan: MultiDayPlan = {
  id: "multi-1",
  days: 7,
  has_repeats: true,
  total_unique_meals: 20,
  total_repeated_meals: 8,
  total_price: 4200,
  plans: Array.from({ length: 7 }, (_, i) => ({
    ...mockPlan,
    id: `day-${i + 1}`,
    day: i + 1,
    date: `2026-02-${22 + i}`,
    repeated_meal_ids: i > 0 ? ["meal-b"] : [],
    items: i === 0
      ? mockPlan.items
      : [
          {
            ...mockPlan.items[0],
            meal_id: "meal-b",
            meal_name: "Pancakes",
            meal: { ...mockMeal, id: "meal-b", name: "Pancakes", price: 149 },
          },
          {
            ...mockPlan.items[1],
            meal_id: `meal-l${i + 1}`,
            meal_name: `Lunch ${i + 1}`,
            meal: { ...mockMeal, id: `meal-l${i + 1}`, name: `Lunch ${i + 1}` },
          },
          {
            ...mockPlan.items[2],
            meal_id: `meal-d${i + 1}`,
            meal_name: `Dinner ${i + 1}`,
            meal: { ...mockMeal, id: `meal-d${i + 1}`, name: `Dinner ${i + 1}`, price: 199 },
          },
          {
            ...mockPlan.items[3],
            meal_id: `meal-s${i + 1}`,
            meal_name: `Snack ${i + 1}`,
            meal: { ...mockMeal, id: `meal-s${i + 1}`, name: `Snack ${i + 1}`, price: 59 },
          },
        ],
  })),
};

vi.mock("../../api/endpoints/matching", () => ({
  generatePlan: vi.fn(),
  generateMultiDayPlan: vi.fn(),
  recalculatePlan: vi.fn(),
  getSlotAlternatives: vi.fn(),
}));

import {
  generateMultiDayPlan,
} from "../../api/endpoints/matching";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("PlanGeneratorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [], planContexts: [], pricingRates: null });
  });

  it("shows generate button initially", () => {
    renderWithRouter(<PlanGeneratorPage />);
    expect(screen.getByText("Generate Plan")).toBeInTheDocument();
  });

  it("shows day count slider", () => {
    renderWithRouter(<PlanGeneratorPage />);
    expect(screen.getByLabelText("Plan duration")).toBeInTheDocument();
    expect(screen.getByText("7 days")).toBeInTheDocument();
  });

  it("slider has minimum of 5 days", () => {
    renderWithRouter(<PlanGeneratorPage />);
    const slider = screen.getByLabelText("Plan duration") as HTMLInputElement;
    expect(slider.min).toBe("5");
    expect(slider.max).toBe("30");
  });

  it("generates plan and shows day tabs", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(screen.getByText("Day 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Pancakes")).toBeInTheDocument();
    expect(screen.getByText("Chicken")).toBeInTheDocument();
    expect(screen.getByText("Salmon")).toBeInTheDocument();
    expect(screen.getByText("Bar")).toBeInTheDocument();
  });

  it("shows swap button on each slot card", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));
    await waitFor(() => {
      expect(screen.getByText("Pancakes")).toBeInTheDocument();
    });

    const swapButtons = screen.getAllByText("Swap");
    expect(swapButtons).toHaveLength(4);
  });

  it("shows positive and negative extras on plan items", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
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

  it("shows total plan price", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));
    await waitFor(() => {
      expect(screen.getByText("฿4200")).toBeInTheDocument();
    });
  });

  it("shows Meals/Nutrition tab bar after generation", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));
    await waitFor(() => {
      expect(screen.getByText("Meals")).toBeInTheDocument();
    });
    const nutritionButtons = screen.getAllByText("Nutrition");
    expect(nutritionButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("switches to inline nutrition datasheet on Nutrition tab", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));
    await waitFor(() => {
      expect(screen.getByText("Pancakes")).toBeInTheDocument();
    });

    const nutritionButtons = screen.getAllByText("Nutrition");
    fireEvent.click(nutritionButtons[0]);
    await waitFor(() => {
      expect(screen.getByText("Macro Split")).toBeInTheDocument();
    });
    expect(screen.getByTestId("nutrition-label")).toBeInTheDocument();
  });

  it("shows repeat warning when has_repeats is true", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(
        screen.getByText(/Some meals are repeated across days/),
      ).toBeInTheDocument();
    });
  });

  it("shows summary header with unique meals count", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(screen.getByText("20 unique meals")).toBeInTheDocument();
    });
  });

  it("switches day content when clicking day tab", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(screen.getByText("Day 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Pancakes")).toBeInTheDocument();
    expect(screen.getByText("Chicken")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Day 2"));

    await waitFor(() => {
      expect(screen.getByText("Lunch 2")).toBeInTheDocument();
    });
    expect(screen.getByText("Dinner 2")).toBeInTheDocument();
  });

  it("shows Repeated badge on repeated meals", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(screen.getByText("Day 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Day 2"));

    await waitFor(() => {
      expect(screen.getByText("Repeated")).toBeInTheDocument();
    });
  });

  it("adds all days to cart", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(screen.getByText("Add Plan to Cart")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Plan to Cart"));

    // 4 items per day * 7 days = 28, but Pancakes (meal-b) repeats across all 7 days
    // with same extras, so it deduplicates to 1 item with qty 7
    // Day 1: 4 unique meals. Days 2-7: 3 unique + 1 repeated = 3*6=18 unique + 1 deduped
    // Total unique items: 4 + 18 = 22, plus the repeated Pancakes = 22 items
    const cartItems = useCartStore.getState().items;
    expect(cartItems.length).toBeGreaterThan(0);
    const repeatedItem = cartItems.find((i) => i.meal.id === "meal-b");
    expect(repeatedItem?.quantity).toBe(7);
    expect(mockNavigate).toHaveBeenCalledWith("/cart");
  });
});
