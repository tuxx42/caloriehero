import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SlotSwapModal } from "../SlotSwapModal";
import type { SlotAlternative, Meal } from "../../../api/types";

vi.mock("../../../api/endpoints/matching", () => ({
  getSlotAlternatives: vi.fn(),
}));

import { getSlotAlternatives } from "../../../api/endpoints/matching";

const mockMeal: Meal = {
  id: "alt-1",
  name: "Egg Wrap",
  description: "Wrap with eggs",
  category: "breakfast",
  calories: 350,
  protein: 25,
  carbs: 30,
  fat: 12,
  fiber: null,
  sugar: null,
  serving_size: "250g",
  price: 120,
  allergens: [],
  dietary_tags: [],
  image_url: null,
  active: true,
  protein_price_per_gram: null,
  carbs_price_per_gram: null,
  fat_price_per_gram: null,
  nutritional_benefits: null,
};

const mockAlternatives: SlotAlternative[] = [
  {
    meal_id: "alt-1",
    meal_name: "Egg Wrap",
    score: 0.91,
    category: "breakfast",
    meal: mockMeal,
  },
  {
    meal_id: "alt-2",
    meal_name: "Granola Bowl",
    score: 0.85,
    category: "breakfast",
    meal: { ...mockMeal, id: "alt-2", name: "Granola Bowl", price: 99 },
  },
];

describe("SlotSwapModal", () => {
  const onSwap = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state then alternatives", async () => {
    vi.mocked(getSlotAlternatives).mockResolvedValue(mockAlternatives);
    render(
      <SlotSwapModal
        slot="breakfast"
        currentMealId="current-1"
        planMealIds={["current-1", "meal-2", "meal-3", "meal-4"]}
        onSwap={onSwap}
        onClose={onClose}
      />,
    );

    // Title visible immediately
    expect(screen.getByText("Swap breakfast")).toBeInTheDocument();

    // Wait for alternatives to load
    await waitFor(() => {
      expect(screen.getByText("Egg Wrap")).toBeInTheDocument();
    });
    expect(screen.getByText("Granola Bowl")).toBeInTheDocument();
    expect(screen.getByText("91% match")).toBeInTheDocument();
    expect(screen.getByText("85% match")).toBeInTheDocument();
  });

  it("calls onSwap when an alternative is selected", async () => {
    vi.mocked(getSlotAlternatives).mockResolvedValue(mockAlternatives);
    render(
      <SlotSwapModal
        slot="breakfast"
        currentMealId="current-1"
        planMealIds={["current-1"]}
        onSwap={onSwap}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Egg Wrap")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Egg Wrap"));
    expect(onSwap).toHaveBeenCalledWith("breakfast", "alt-1");
  });

  it("calls onClose when cancel is clicked", async () => {
    vi.mocked(getSlotAlternatives).mockResolvedValue(mockAlternatives);
    render(
      <SlotSwapModal
        slot="breakfast"
        currentMealId="current-1"
        planMealIds={["current-1"]}
        onSwap={onSwap}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Egg Wrap")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows error state on fetch failure", async () => {
    vi.mocked(getSlotAlternatives).mockRejectedValue(
      new Error("Network error"),
    );
    render(
      <SlotSwapModal
        slot="breakfast"
        currentMealId="current-1"
        planMealIds={["current-1"]}
        onSwap={onSwap}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
