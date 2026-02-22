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
  days: 2,
  has_repeats: true,
  total_unique_meals: 7,
  total_repeated_meals: 1,
  total_price: 1200,
  plans: [
    {
      ...mockPlan,
      id: "day-1",
      day: 1,
      date: "2026-02-22",
      repeated_meal_ids: [],
    },
    {
      ...mockPlan,
      id: "day-2",
      day: 2,
      date: "2026-02-23",
      repeated_meal_ids: ["meal-b"],
      items: [
        {
          ...mockPlan.items[0],
          meal_id: "meal-b",
          meal_name: "Pancakes",
          meal: { ...mockMeal, id: "meal-b", name: "Pancakes", price: 149 },
        },
        {
          ...mockPlan.items[1],
          meal_id: "meal-l2",
          meal_name: "Pasta",
          meal: { ...mockMeal, id: "meal-l2", name: "Pasta" },
        },
        {
          ...mockPlan.items[2],
          meal_id: "meal-d2",
          meal_name: "Steak",
          meal: { ...mockMeal, id: "meal-d2", name: "Steak", price: 199 },
        },
        {
          ...mockPlan.items[3],
          meal_id: "meal-s2",
          meal_name: "Nuts",
          meal: { ...mockMeal, id: "meal-s2", name: "Nuts", price: 59 },
        },
      ],
    },
  ],
};

vi.mock("../../api/endpoints/matching", () => ({
  generatePlan: vi.fn(),
  generateMultiDayPlan: vi.fn(),
  recalculatePlan: vi.fn(),
  getSlotAlternatives: vi.fn(),
}));

import {
  generatePlan,
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

  it("shows mode toggle", () => {
    renderWithRouter(<PlanGeneratorPage />);
    expect(screen.getByText("1 Day")).toBeInTheDocument();
    expect(screen.getByText("Multi-Day")).toBeInTheDocument();
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

describe("PlanGeneratorPage — Multi-Day", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [], planContext: null, pricingRates: null });
  });

  it("shows day count input when multi-day mode is selected", () => {
    renderWithRouter(<PlanGeneratorPage />);
    fireEvent.click(screen.getByText("Multi-Day"));
    expect(screen.getByLabelText("Number of days:")).toBeInTheDocument();
  });

  it("generates multi-day plan and shows day tabs", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Multi-Day"));
    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(screen.getByText("Day 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Day 2")).toBeInTheDocument();
  });

  it("shows repeat warning when has_repeats is true", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Multi-Day"));
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

    fireEvent.click(screen.getByText("Multi-Day"));
    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(screen.getByText("7 unique meals")).toBeInTheDocument();
    });
  });

  it("switches day content when clicking day tab", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Multi-Day"));
    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(screen.getByText("Day 1")).toBeInTheDocument();
    });

    // Day 1 shows Pancakes, Chicken, Salmon, Bar
    expect(screen.getByText("Pancakes")).toBeInTheDocument();
    expect(screen.getByText("Chicken")).toBeInTheDocument();

    // Switch to Day 2
    fireEvent.click(screen.getByText("Day 2"));

    await waitFor(() => {
      expect(screen.getByText("Pasta")).toBeInTheDocument();
    });
    expect(screen.getByText("Steak")).toBeInTheDocument();
  });

  it("shows Repeated badge on repeated meals", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Multi-Day"));
    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(screen.getByText("Day 1")).toBeInTheDocument();
    });

    // Switch to Day 2 which has repeats
    fireEvent.click(screen.getByText("Day 2"));

    await waitFor(() => {
      expect(screen.getByText("Repeated")).toBeInTheDocument();
    });
  });

  it("shows total price for multi-day plan", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Multi-Day"));
    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(screen.getByText("฿1200")).toBeInTheDocument();
    });
  });

  it("adds all days to cart", async () => {
    vi.mocked(generateMultiDayPlan).mockResolvedValue(mockMultiDayPlan);
    renderWithRouter(<PlanGeneratorPage />);

    fireEvent.click(screen.getByText("Multi-Day"));
    fireEvent.click(screen.getByText("Generate Plan"));

    await waitFor(() => {
      expect(screen.getByText("Add All Days to Cart")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add All Days to Cart"));

    // 4 items per day * 2 days = 8 total, but meal-b (Pancakes) appears in both
    // days with same extras, so cart deduplicates to 7 items (one with qty 2)
    const cartItems = useCartStore.getState().items;
    expect(cartItems).toHaveLength(7);
    const repeatedItem = cartItems.find((i) => i.meal.id === "meal-b");
    expect(repeatedItem?.quantity).toBe(2);
    expect(mockNavigate).toHaveBeenCalledWith("/cart");
  });
});
