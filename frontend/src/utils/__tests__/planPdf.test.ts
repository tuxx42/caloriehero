import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DailyPlan, DayPlan, Meal, MacroTargets, MultiDayPlan, UserProfile } from "../../api/types";
import type { BodyStats } from "../tdee";

// Mock jsPDF
const mockDoc = {
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setTextColor: vi.fn(),
  setFillColor: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  line: vi.fn(),
  text: vi.fn(),
  rect: vi.fn(),
  roundedRect: vi.fn(),
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

const mockDay1: DayPlan = {
  ...mockPlan,
  id: "day-1",
  day: 1,
  date: "2026-02-22",
  repeated_meal_ids: [],
};

const mockDay2: DayPlan = {
  ...mockPlan,
  id: "day-2",
  day: 2,
  date: "2026-02-23",
  total_score: 0.88,
  repeated_meal_ids: ["m1"],
  items: [
    {
      ...mockPlan.items[0],
      meal_name: "Yogurt Parfait",
      meal: makeMeal({ id: "m5", name: "Yogurt Parfait", calories: 350, protein: 25, carbs: 45, fat: 10, price: 110 }),
    },
    {
      ...mockPlan.items[1],
      meal_name: "Beef Stir Fry",
      meal: makeMeal({ id: "m6", name: "Beef Stir Fry", calories: 550, protein: 42, carbs: 55, fat: 20, price: 220 }),
    },
    {
      ...mockPlan.items[2],
      meal_name: "Pasta Bowl",
      meal: makeMeal({ id: "m7", name: "Pasta Bowl", calories: 480, protein: 30, carbs: 60, fat: 16, price: 190 }),
    },
    {
      ...mockPlan.items[3],
      meal_name: "Trail Mix",
      meal: makeMeal({ id: "m8", name: "Trail Mix", calories: 200, protein: 8, carbs: 25, fat: 10, price: 70 }),
    },
  ],
};

const mockMultiDayPlan: MultiDayPlan = {
  id: "multi-1",
  days: 2,
  has_repeats: true,
  total_unique_meals: 7,
  total_repeated_meals: 1,
  total_price: 1240,
  plans: [mockDay1, mockDay2],
};

describe("generatePlanPdf — single day", () => {
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

  it("renders rect calls for macro split bar", async () => {
    await callGenerate();
    const rectCalls = mockDoc.rect.mock.calls;
    expect(rectCalls.length).toBeGreaterThanOrEqual(3);
    for (const call of rectCalls) {
      expect(call[4]).toBe("F");
    }
  });

  it("makes 1 autoTable call for meal schedule", async () => {
    await callGenerate();
    expect(mockAutoTable).toHaveBeenCalledTimes(1);
    const firstCall = mockAutoTable.mock.calls[0][1];
    expect(firstCall.head[0]).toEqual(["Meal", "Item", "Cal", "Pro", "Carb", "Fat"]);
    const body = firstCall.body;
    expect(body[body.length - 2][0]).toBe("TOTAL");
    expect(body[body.length - 1][0]).toBe("TARGET");
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

describe("generatePlanPdf — multi-day", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.lastAutoTable = { finalY: 100 };
  });

  async function callGenerateMultiDay() {
    const { generatePlanPdf } = await import("../planPdf");
    await generatePlanPdf({ plan: mockDay1, multiDayPlan: mockMultiDayPlan });
  }

  it("saves with multi-day filename", async () => {
    await callGenerateMultiDay();
    expect(mockDoc.save).toHaveBeenCalledWith("meal-plan-2day-2026-02-22.pdf");
  });

  it("renders multi-day title with days count", async () => {
    await callGenerateMultiDay();
    const textCalls = mockDoc.text.mock.calls;
    expect(textCalls.some((c: unknown[]) => c[0] === "2-Day Meal Plan")).toBe(true);
  });

  it("renders date range", async () => {
    await callGenerateMultiDay();
    const textCalls = mockDoc.text.mock.calls;
    expect(
      textCalls.some(
        (c: unknown[]) =>
          typeof c[0] === "string" && c[0].includes("2026-02-22") && c[0].includes("2026-02-23"),
      ),
    ).toBe(true);
  });

  it("renders avg match score", async () => {
    await callGenerateMultiDay();
    const textCalls = mockDoc.text.mock.calls;
    // avg = (0.92 + 0.88) / 2 = 0.9 → 90%
    expect(textCalls.some((c: unknown[]) => c[0] === "90% avg match")).toBe(true);
  });

  it("adds pages for each day", async () => {
    await callGenerateMultiDay();
    // 2 addPage calls: one per day (days render on new pages)
    expect(mockDoc.addPage).toHaveBeenCalledTimes(2);
  });

  it("renders day labels", async () => {
    await callGenerateMultiDay();
    const textCalls = mockDoc.text.mock.calls;
    expect(textCalls.some((c: unknown[]) => c[0] === "Day 1")).toBe(true);
    expect(textCalls.some((c: unknown[]) => c[0] === "Day 2")).toBe(true);
  });

  it("renders summary table with unique/repeated meal counts", async () => {
    await callGenerateMultiDay();
    // Summary table is the first autoTable call
    const summaryCall = mockAutoTable.mock.calls[0][1];
    expect(summaryCall.head[0]).toEqual(["Metric", "Average / Day", "Target"]);
    // Check unique meals row
    const body = summaryCall.body;
    expect(body.some((r: string[]) => r[0] === "Unique Meals" && r[1] === "7")).toBe(true);
    expect(body.some((r: string[]) => r[0] === "Repeated Meals" && r[1] === "1")).toBe(true);
  });

  it("makes 3 autoTable calls: summary + 2 day schedules", async () => {
    await callGenerateMultiDay();
    // 1 summary table + 2 day schedule tables = 3
    expect(mockAutoTable).toHaveBeenCalledTimes(3);
  });

  it("renders total price for multi-day", async () => {
    await callGenerateMultiDay();
    const textCalls = mockDoc.text.mock.calls;
    expect(textCalls.some((c: unknown[]) => c[0] === "฿1240")).toBe(true);
  });
});

const mockUserProfile: UserProfile = {
  id: "profile-1",
  user_id: "user-1",
  macro_targets: targetMacros,
  fitness_goal: "cutting",
  allergies: ["dairy", "gluten"],
  dietary_preferences: ["high_protein"],
  delivery_address: null,
  delivery_lat: null,
  delivery_lng: null,
  weight_kg: 85,
  height_cm: 180,
  age: 30,
  gender: "male",
  activity_level: "moderate",
};

const mockBodyStats: BodyStats = {
  weight: 85,
  height: 180,
  age: 30,
  gender: "male",
  activityLevel: "moderate",
};

describe("generatePlanPdf — FDA nutrition facts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.lastAutoTable = { finalY: 100 };
  });

  it("renders FDA nutrition facts for single day", async () => {
    const { generatePlanPdf } = await import("../planPdf");
    await generatePlanPdf({ plan: mockPlan });
    const textCalls = mockDoc.text.mock.calls;
    expect(textCalls.some((c: unknown[]) => c[0] === "Nutrition Facts")).toBe(true);
    expect(textCalls.some((c: unknown[]) => c[0] === "Calories")).toBe(true);
    expect(
      textCalls.some(
        (c: unknown[]) => typeof c[0] === "string" && c[0] === "% Daily Value*",
      ),
    ).toBe(true);
  });

  it("renders FDA nutrition facts for each day in multi-day", async () => {
    const { generatePlanPdf } = await import("../planPdf");
    await generatePlanPdf({ plan: mockDay1, multiDayPlan: mockMultiDayPlan });
    const textCalls = mockDoc.text.mock.calls;
    // "Nutrition Facts" should appear once per day (2 days)
    const nutritionFactsCount = textCalls.filter(
      (c: unknown[]) => c[0] === "Nutrition Facts",
    ).length;
    expect(nutritionFactsCount).toBe(2);
  });
});

describe("generatePlanPdf — user profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.lastAutoTable = { finalY: 100 };
  });

  it("renders user profile section when provided", async () => {
    const { generatePlanPdf } = await import("../planPdf");
    await generatePlanPdf({ plan: mockPlan, userProfile: mockUserProfile, bodyStats: mockBodyStats });
    const textCalls = mockDoc.text.mock.calls;
    expect(textCalls.some((c: unknown[]) => c[0] === "Your Profile")).toBe(true);
    expect(textCalls.some((c: unknown[]) => c[0] === "Macro Targets")).toBe(true);
    // Check profile autoTable has fitness goal
    const profileTable = mockAutoTable.mock.calls.find(
      (call: unknown[]) => {
        const opts = call[1] as { head?: string[][] };
        return opts.head?.[0]?.[0] === "Field" && opts.head?.[0]?.[1] === "Value";
      },
    );
    expect(profileTable).toBeDefined();
    const body = (profileTable![1] as { body: string[][] }).body;
    expect(body.some((r: string[]) => r[0] === "Fitness Goal" && r[1] === "Cutting")).toBe(true);
    expect(body.some((r: string[]) => r[0] === "Weight" && r[1] === "85 kg")).toBe(true);
  });

  it("renders allergies and dietary preferences", async () => {
    const { generatePlanPdf } = await import("../planPdf");
    await generatePlanPdf({ plan: mockPlan, userProfile: mockUserProfile });
    const textCalls = mockDoc.text.mock.calls;
    expect(
      textCalls.some(
        (c: unknown[]) => typeof c[0] === "string" && c[0].includes("Allergies:"),
      ),
    ).toBe(true);
    expect(
      textCalls.some(
        (c: unknown[]) => typeof c[0] === "string" && c[0].includes("Dietary Preferences:"),
      ),
    ).toBe(true);
  });

  it("skips profile and projection when not provided", async () => {
    const { generatePlanPdf } = await import("../planPdf");
    await generatePlanPdf({ plan: mockPlan });
    const textCalls = mockDoc.text.mock.calls;
    expect(textCalls.some((c: unknown[]) => c[0] === "Your Profile")).toBe(false);
    expect(textCalls.some((c: unknown[]) => c[0] === "Weight Projection")).toBe(false);
  });
});

describe("generatePlanPdf — weight projection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.lastAutoTable = { finalY: 100 };
  });

  it("renders weight projection when bodyStats provided", async () => {
    const { generatePlanPdf } = await import("../planPdf");
    await generatePlanPdf({ plan: mockPlan, bodyStats: mockBodyStats, numDays: 7 });
    const textCalls = mockDoc.text.mock.calls;
    expect(textCalls.some((c: unknown[]) => c[0] === "Weight Projection")).toBe(true);
    // Check TDEE text
    expect(
      textCalls.some(
        (c: unknown[]) => typeof c[0] === "string" && c[0].includes("TDEE:"),
      ),
    ).toBe(true);
    // Check surplus/deficit text
    expect(
      textCalls.some(
        (c: unknown[]) =>
          typeof c[0] === "string" &&
          (c[0].includes("surplus") || c[0].includes("deficit")),
      ),
    ).toBe(true);
    // Check weight projection arrow text
    expect(
      textCalls.some(
        (c: unknown[]) =>
          typeof c[0] === "string" && c[0].includes("kg →"),
      ),
    ).toBe(true);
  });

  it("renders weight projection for multi-day", async () => {
    const { generatePlanPdf } = await import("../planPdf");
    await generatePlanPdf({
      plan: mockDay1,
      multiDayPlan: mockMultiDayPlan,
      bodyStats: mockBodyStats,
      numDays: 2,
    });
    const textCalls = mockDoc.text.mock.calls;
    expect(textCalls.some((c: unknown[]) => c[0] === "Weight Projection")).toBe(true);
  });
});
