import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PlanDatasheet } from "../PlanDatasheet";
import type { DailyPlan, Meal, MacroTargets } from "../../../api/types";

vi.mock("../../../utils/planPdf", () => ({
  generatePlanPdf: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../utils/svgToImage", () => ({
  svgToDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
}));

function makeMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: "m1",
    name: "Test Meal",
    description: "A test meal",
    category: "lunch",
    calories: 500,
    protein: 40,
    carbs: 50,
    fat: 15,
    fiber: 5,
    sugar: 6,
    serving_size: "350g",
    price: 180,
    allergens: [],
    dietary_tags: [],
    image_url: null,
    active: true,
    protein_price_per_gram: null,
    carbs_price_per_gram: null,
    fat_price_per_gram: null,
    nutritional_benefits: null,
    ...overrides,
  };
}

const targetMacros: MacroTargets = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

const mockPlan: DailyPlan = {
  id: "plan1",
  date: "2026-02-22",
  total_score: 0.92,
  actual_macros: { calories: 1530, protein: 127, carbs: 145, fat: 53 },
  target_macros: targetMacros,
  total_extra_price: 40,
  items: [
    {
      slot: "breakfast",
      meal_id: "m1",
      meal_name: "Oatmeal Bowl",
      score: 0.9,
      slot_targets: { calories: 400, protein: 30, carbs: 50, fat: 14 },
      extra_protein: 0,
      extra_carbs: 0,
      extra_fat: 0,
      extra_price: 0,
      meal: makeMeal({
        id: "m1",
        name: "Oatmeal Bowl",
        calories: 380,
        protein: 32,
        carbs: 40,
        fat: 12,
        fiber: 3,
        sugar: 5,
        price: 120,
        allergens: ["dairy"],
        dietary_tags: ["high_protein"],
      }),
    },
    {
      slot: "lunch",
      meal_id: "m2",
      meal_name: "Grilled Chicken",
      score: 0.95,
      slot_targets: { calories: 600, protein: 50, carbs: 60, fat: 20 },
      extra_protein: 5,
      extra_carbs: 0,
      extra_fat: 0,
      extra_price: 20,
      meal: makeMeal({
        id: "m2",
        name: "Grilled Chicken",
        calories: 520,
        protein: 48,
        carbs: 45,
        fat: 18,
        fiber: 5,
        sugar: 3,
        price: 200,
        allergens: ["dairy", "wheat"],
        dietary_tags: ["high_protein", "gluten_free"],
      }),
    },
    {
      slot: "dinner",
      meal_id: "m3",
      meal_name: "Salmon Plate",
      score: 0.88,
      slot_targets: { calories: 500, protein: 40, carbs: 50, fat: 18 },
      extra_protein: 0,
      extra_carbs: 0,
      extra_fat: 0,
      extra_price: 0,
      meal: makeMeal({
        id: "m3",
        name: "Salmon Plate",
        calories: 450,
        protein: 35,
        carbs: 38,
        fat: 15,
        fiber: 4,
        sugar: 6,
        price: 250,
        allergens: ["fish"],
        dietary_tags: ["omega_rich"],
      }),
    },
    {
      slot: "snack",
      meal_id: "m4",
      meal_name: "Protein Bar",
      score: 0.85,
      slot_targets: { calories: 200, protein: 15, carbs: 20, fat: 8 },
      extra_protein: 0,
      extra_carbs: 0,
      extra_fat: 0,
      extra_price: 20,
      meal: makeMeal({
        id: "m4",
        name: "Protein Bar",
        calories: 180,
        protein: 12,
        carbs: 22,
        fat: 8,
        fiber: 2,
        sugar: 8,
        price: 80,
        allergens: ["dairy", "soy"],
        dietary_tags: ["high_protein"],
      }),
    },
  ],
};

describe("PlanDatasheet", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("renders Daily Plan header with match score", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Daily Plan")).toBeInTheDocument();
    expect(screen.getByText("92% match")).toBeInTheDocument();
  });

  it("renders formatted plan date", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    // Date "2026-02-22" should be formatted as a readable date
    expect(screen.getByText(/February 22, 2026/)).toBeInTheDocument();
  });

  it("renders meal schedule table with all meals", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Meal Schedule")).toBeInTheDocument();
    const table = screen.getByTestId("meal-schedule-table");
    expect(table).toBeInTheDocument();
    // Check meal names appear
    expect(screen.getByText("Oatmeal Bowl")).toBeInTheDocument();
    expect(screen.getByText("Grilled Chicken")).toBeInTheDocument();
    expect(screen.getByText("Salmon Plate")).toBeInTheDocument();
    expect(screen.getByText("Protein Bar")).toBeInTheDocument();
    // Check TOTAL and TARGET rows
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
    expect(screen.getByText("TARGET")).toBeInTheDocument();
  });

  it("renders radar chart SVG", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(
      screen.getByRole("img", { name: "Macro radar chart" }),
    ).toBeInTheDocument();
  });

  it("shows macro split percentages", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Macro Split")).toBeInTheDocument();
    const proteinPct = Math.round((127 * 4 / (127 * 4 + 145 * 4 + 53 * 9)) * 100);
    const fatPct = Math.round((53 * 9 / (127 * 4 + 145 * 4 + 53 * 9)) * 100);
    const carbsPct = 100 - proteinPct - fatPct;
    expect(
      screen.getByText(`${proteinPct}% P / ${carbsPct}% C / ${fatPct}% F`),
    ).toBeInTheDocument();
  });

  it("shows calorie gap (under target)", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Calorie & Macro Gap")).toBeInTheDocument();
    expect(screen.getByText("-470 kcal")).toBeInTheDocument();
    expect(screen.getByText("under target")).toBeInTheDocument();
  });

  it("shows calorie gap (over target)", () => {
    const overPlan = {
      ...mockPlan,
      actual_macros: { calories: 2200, protein: 150, carbs: 200, fat: 65 },
    };
    render(<PlanDatasheet plan={overPlan} onClose={mockOnClose} />);
    expect(screen.getByText("+200 kcal")).toBeInTheDocument();
    expect(screen.getByText("over target")).toBeInTheDocument();
  });

  it("shows macro gap deltas", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("-23g")).toBeInTheDocument();
    expect(screen.getByText("-55g")).toBeInTheDocument();
    expect(screen.getByText("-12g")).toBeInTheDocument();
    expect(screen.getByText("-14g")).toBeInTheDocument();
  });

  it("shows FDA Nutrition Facts label", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByTestId("nutrition-label")).toBeInTheDocument();
  });

  it("shows calorie contribution bar with slot labels", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Calorie Contribution")).toBeInTheDocument();
    expect(screen.getAllByText(/breakfast/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/lunch/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/dinner/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/snack/i).length).toBeGreaterThan(0);
  });

  it("shows combined allergens with meal attribution", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Allergens")).toBeInTheDocument();
    expect(screen.getByText("(Breakfast, Lunch, Snack)")).toBeInTheDocument();
    expect(screen.getByText("(Lunch)")).toBeInTheDocument();
    expect(screen.getByText("(Dinner)")).toBeInTheDocument();
    expect(screen.getByText("(Snack)")).toBeInTheDocument();
  });

  it("shows combined dietary tags (deduplicated)", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Dietary Tags")).toBeInTheDocument();
    expect(screen.getByText("High Protein")).toBeInTheDocument();
    expect(screen.getByText("Gluten Free")).toBeInTheDocument();
    expect(screen.getByText("Omega Rich")).toBeInTheDocument();
  });

  it("shows total price", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("฿690")).toBeInTheDocument();
  });

  it("calls onClose when Close button is clicked", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText("Close"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when X button (SVG close icon) is clicked", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    // Close icon is now an SVG button - find the first button element
    const buttons = screen.getAllByRole("button");
    // The X/close button is the one in the header area (not the "Close" text button or PDF button)
    const closeIconBtn = buttons.find((btn) => {
      const svg = btn.querySelector("svg");
      return svg && btn.textContent === "";
    });
    expect(closeIconBtn).toBeDefined();
    fireEvent.click(closeIconBtn!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("hides allergens section when no meals have allergens", () => {
    const noAllergenPlan = {
      ...mockPlan,
      items: mockPlan.items.map((item) => ({
        ...item,
        meal: { ...item.meal, allergens: [] },
      })),
    };
    render(<PlanDatasheet plan={noAllergenPlan} onClose={mockOnClose} />);
    expect(screen.queryByText("Allergens")).not.toBeInTheDocument();
  });

  it("hides dietary tags section when no meals have tags", () => {
    const noTagsPlan = {
      ...mockPlan,
      items: mockPlan.items.map((item) => ({
        ...item,
        meal: { ...item.meal, dietary_tags: [] },
      })),
    };
    render(<PlanDatasheet plan={noTagsPlan} onClose={mockOnClose} />);
    expect(screen.queryByText("Dietary Tags")).not.toBeInTheDocument();
  });

  it("renders Download PDF button", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Download PDF")).toBeInTheDocument();
  });

  it("calls generatePlanPdf when Download PDF is clicked", async () => {
    const { generatePlanPdf } = await import("../../../utils/planPdf");
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText("Download PDF"));
    await waitFor(() => {
      expect(generatePlanPdf).toHaveBeenCalledWith({
        plan: mockPlan,
        radarChartDataUrl: "data:image/png;base64,mock",
      });
    });
  });

  it("shows Generating... loading state while PDF generates", async () => {
    const { generatePlanPdf } = await import("../../../utils/planPdf");
    let resolveGenerate!: () => void;
    vi.mocked(generatePlanPdf).mockImplementation(
      () => new Promise<void>((resolve) => { resolveGenerate = resolve; }),
    );
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText("Download PDF"));
    await waitFor(() => {
      expect(screen.getByText("Generating...")).toBeInTheDocument();
    });
    resolveGenerate();
    await waitFor(() => {
      expect(screen.getByText("Download PDF")).toBeInTheDocument();
    });
  });
});
