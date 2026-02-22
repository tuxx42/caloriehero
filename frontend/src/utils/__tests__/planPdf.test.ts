import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DailyPlan, Meal, MacroTargets } from "../../api/types";

// Mock jsPDF
const mockDoc = {
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setTextColor: vi.fn(),
  setFillColor: vi.fn(),
  text: vi.fn(),
  rect: vi.fn(),
  addImage: vi.fn(),
  addPage: vi.fn(),
  getTextWidth: vi.fn().mockReturnValue(20),
  save: vi.fn(),
  lastAutoTable: { finalY: 100 },
};

vi.mock("jspdf", () => ({
  jsPDF: vi.fn(() => mockDoc),
}));

const mockAutoTable = vi.fn();
vi.mock("jspdf-autotable", () => ({
  default: (...args: unknown[]) => mockAutoTable(...args),
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

describe("generatePlanPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.lastAutoTable = { finalY: 100 };
  });

  async function callGenerate(radarChartDataUrl?: string) {
    const { generatePlanPdf } = await import("../planPdf");
    await generatePlanPdf({ plan: mockPlan, radarChartDataUrl });
  }

  it("saves PDF with correct filename", async () => {
    await callGenerate();
    expect(mockDoc.save).toHaveBeenCalledWith("meal-plan-2026-02-22.pdf");
  });

  it("renders title with date and match score", async () => {
    await callGenerate();
    const textCalls = mockDoc.text.mock.calls;
    expect(textCalls.some((c: unknown[]) => c[0] === "Daily Meal Plan")).toBe(true);
    expect(textCalls.some((c: unknown[]) => c[0] === "2026-02-22")).toBe(true);
    expect(textCalls.some((c: unknown[]) => c[0] === "92% match")).toBe(true);
  });

  it("renders 3 rect calls for macro split bar", async () => {
    await callGenerate();
    // rect is called for: 3 macro split segments + calorie contribution bars (4) + legend dots (4)
    // The first 3 rect calls after title are the macro split bar
    const rectCalls = mockDoc.rect.mock.calls;
    // At minimum 3 for macro split
    expect(rectCalls.length).toBeGreaterThanOrEqual(3);
    // Check fill style "F" on the first 3
    expect(rectCalls[0][4]).toBe("F");
    expect(rectCalls[1][4]).toBe("F");
    expect(rectCalls[2][4]).toBe("F");
  });

  it("makes 2 autoTable calls (daily values + nutrition breakdown)", async () => {
    await callGenerate();
    expect(mockAutoTable).toHaveBeenCalledTimes(2);
    // First table: daily values
    const firstCall = mockAutoTable.mock.calls[0][1];
    expect(firstCall.head[0]).toEqual(["Nutrient", "Actual", "%"]);
    // Second table: nutrition breakdown
    const secondCall = mockAutoTable.mock.calls[1][1];
    expect(secondCall.head[0]).toContain("Total");
    expect(secondCall.head[0]).toContain("Target");
  });

  it("adds image when radar data URL is provided", async () => {
    await callGenerate("data:image/png;base64,abc123");
    expect(mockDoc.addImage).toHaveBeenCalledWith(
      "data:image/png;base64,abc123",
      "PNG",
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("does not add image when radar data URL is omitted", async () => {
    await callGenerate();
    expect(mockDoc.addImage).not.toHaveBeenCalled();
  });

  it("renders allergens text", async () => {
    await callGenerate();
    const textCalls = mockDoc.text.mock.calls;
    expect(textCalls.some((c: unknown[]) => c[0] === "Allergens")).toBe(true);
    // Dairy appears in breakfast, lunch, snack
    expect(
      textCalls.some(
        (c: unknown[]) =>
          typeof c[0] === "string" && c[0].includes("Dairy"),
      ),
    ).toBe(true);
  });

  it("renders dietary tags text", async () => {
    await callGenerate();
    const textCalls = mockDoc.text.mock.calls;
    expect(textCalls.some((c: unknown[]) => c[0] === "Dietary Tags")).toBe(true);
    expect(
      textCalls.some(
        (c: unknown[]) =>
          typeof c[0] === "string" && c[0].includes("High Protein"),
      ),
    ).toBe(true);
  });

  it("renders total price", async () => {
    await callGenerate();
    const textCalls = mockDoc.text.mock.calls;
    // Total: 120+200+250+80 + 40 extra = 690
    expect(textCalls.some((c: unknown[]) => c[0] === "฿690")).toBe(true);
  });
});
