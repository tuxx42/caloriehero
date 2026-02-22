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

  it("renders radar chart SVG", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(
      screen.getByRole("img", { name: "Macro radar chart" }),
    ).toBeInTheDocument();
  });

  it("shows macro split percentages", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Macro Split")).toBeInTheDocument();
    // Protein: 127*4=508, Carbs: 145*4=580, Fat: 53*9=477 → total=1565
    // P: 32%, C: 37%, F: 31% (rounded, with carbsPct = 100-32-31=37)
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
    // 1530 - 2000 = -470
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
    // Protein: 127-150 = -23g
    expect(screen.getByText("-23g")).toBeInTheDocument();
    // Carbs: 145-200 = -55g
    expect(screen.getByText("-55g")).toBeInTheDocument();
    // Fat: 53-65 = -12g
    expect(screen.getByText("-12g")).toBeInTheDocument();
    // Fiber: (3+5+4+2)=14 - 28 = -14g
    expect(screen.getByText("-14g")).toBeInTheDocument();
  });

  it("shows aggregated % daily values", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("% Daily Values")).toBeInTheDocument();
    // Calories: 1530/2000 = 77%
    expect(screen.getByText("(77%)")).toBeInTheDocument();
    // Protein: 127/150 = 85%
    expect(screen.getByText("(85%)")).toBeInTheDocument();
  });

  it("shows nutrition specs table with per-meal columns and totals", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Nutrition Breakdown")).toBeInTheDocument();
    const table = screen.getByTestId("nutrition-table");
    expect(table).toBeInTheDocument();
    // Check Total column header
    expect(screen.getByText("Total")).toBeInTheDocument();
    // Check Target column header
    expect(screen.getByText("Target")).toBeInTheDocument();
  });

  it("shows % column with color coding", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    const table = screen.getByTestId("nutrition-table");
    // Protein: 85% → amber (70-89)
    // Find all cells with "85%" in the table
    const cells = table.querySelectorAll("td");
    const pctCells = Array.from(cells).filter(
      (c) => c.textContent === "85%",
    );
    expect(pctCells.length).toBeGreaterThan(0);
    expect(pctCells[0].className).toContain("amber");
  });

  it("shows calorie contribution bar with slot labels", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Calorie Contribution")).toBeInTheDocument();
    // Check slot labels exist (use getAllByText since slot names appear in allergen attribution too)
    expect(screen.getAllByText(/Breakfast/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Lunch/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dinner/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Snack/).length).toBeGreaterThan(0);
  });

  it("shows combined allergens with meal attribution", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    expect(screen.getByText("Allergens")).toBeInTheDocument();
    // Dairy appears in breakfast, lunch, snack
    expect(screen.getByText("(Breakfast, Lunch, Snack)")).toBeInTheDocument();
    // Wheat appears in lunch
    expect(screen.getByText("(Lunch)")).toBeInTheDocument();
    // Fish appears in dinner
    expect(screen.getByText("(Dinner)")).toBeInTheDocument();
    // Soy appears in snack
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
    // Total: 120+200+250+80 + 40 extra = 690
    expect(screen.getByText("฿690")).toBeInTheDocument();
  });

  it("calls onClose when Close button is clicked", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText("Close"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when X button is clicked", () => {
    render(<PlanDatasheet plan={mockPlan} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText("✕"));
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
