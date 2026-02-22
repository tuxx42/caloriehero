import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("CartPage", () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      pricingRates: {
        protein_price_per_gram: 3,
        carbs_price_per_gram: 1,
        fat_price_per_gram: 1.5,
      },
    });
  });

  it("shows empty state when cart has no items", () => {
    renderWithRouter(<CartPage />);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByText("Browse Meals")).toBeInTheDocument();
  });

  it("shows cart items when items exist", () => {
    useCartStore.setState({
      items: [
        {
          meal: mockMeal,
          quantity: 2,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
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
          meal: mockMeal,
          quantity: 2,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
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
          meal: mockMeal,
          quantity: 1,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
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
          meal: mockMeal,
          quantity: 1,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
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
          meal: mockMeal,
          quantity: 1,
          extraProtein: 0,
          extraCarbs: 0,
          extraFat: 0,
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
          meal: mockMeal,
          quantity: 1,
          extraProtein: 5,
          extraCarbs: -10,
          extraFat: 0,
        },
      ],
    });
    renderWithRouter(<CartPage />);
    expect(screen.getByText("+5g P, -10g C")).toBeInTheDocument();
  });
});
