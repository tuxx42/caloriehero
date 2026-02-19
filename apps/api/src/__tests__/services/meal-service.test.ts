import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Database } from "../../db/index.js";

// ---------------------------------------------------------------------------
// We mock drizzle-orm/pg-core and drizzle-orm operators so we can isolate
// the service from actual DB calls. The strategy is to mock the db object
// that is passed into each service function.
// ---------------------------------------------------------------------------

/**
 * Build a chainable Drizzle query-builder mock.
 * Supports: db.select().from().where().limit() => resolves to `rows`
 *           db.insert().values().returning()   => resolves to `rows`
 *           db.update().set().where().returning() => resolves to `rows`
 */
function buildDbMock(resolvedRows: unknown[] = []) {
  // We want every chained method to return the same object so we can await
  // the whole chain. We make the chain a thenable that resolves to the rows.
  const chain: Record<string, unknown> = {};

  const methods = [
    "select",
    "from",
    "where",
    "limit",
    "insert",
    "values",
    "update",
    "set",
    "delete",
    "returning",
    "orderBy",
  ];

  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }

  // Make the chain awaitable — resolves to `resolvedRows`
  chain["then"] = (
    resolve: (val: unknown[]) => unknown,
    reject: (err: unknown) => unknown
  ) => Promise.resolve(resolvedRows).then(resolve, reject);

  return chain as unknown as Database;
}

// Import the service AFTER we set up any mocks
import * as mealService from "../../services/meal-service.js";

const now = new Date("2024-01-01T00:00:00Z");

const mealRow = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  name: "Grilled Chicken",
  description: "Lean protein",
  category: "lunch",
  calories: 350,
  protein: 45,
  carbs: 10,
  fat: 12,
  fiber: null,
  sugar: null,
  servingSize: "300g",
  price: 150,
  allergens: [],
  dietaryTags: ["high_protein"],
  imageUrl: null,
  active: true,
  posterProductId: null,
  createdAt: now,
  updatedAt: now,
};

describe("meal-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listMeals", () => {
    it("returns mapped meals when rows exist", async () => {
      const db = buildDbMock([mealRow]);

      const result = await mealService.listMeals(db);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Grilled Chicken");
      expect(result[0]!.nutritionalInfo.calories).toBe(350);
    });

    it("returns empty array when no rows", async () => {
      const db = buildDbMock([]);

      const result = await mealService.listMeals(db);

      expect(result).toEqual([]);
    });

    it("passes category filter to query", async () => {
      const db = buildDbMock([mealRow]);

      const result = await mealService.listMeals(db, { category: "lunch" });

      expect(result).toHaveLength(1);
      // The db.select().from().where() chain should have been called
      expect((db.select as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
    });

    it("passes active filter to query", async () => {
      const db = buildDbMock([mealRow]);

      const result = await mealService.listMeals(db, { active: true });

      expect(result).toHaveLength(1);
    });
  });

  describe("getMeal", () => {
    it("returns a mapped meal when found", async () => {
      const db = buildDbMock([mealRow]);

      const result = await mealService.getMeal(db, mealRow.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(mealRow.id);
      expect(result!.nutritionalInfo.protein).toBe(45);
    });

    it("returns null when meal not found", async () => {
      const db = buildDbMock([]);

      const result = await mealService.getMeal(db, "non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createMeal", () => {
    it("inserts and returns the created meal", async () => {
      const db = buildDbMock([mealRow]);

      const result = await mealService.createMeal(db, {
        name: "Grilled Chicken",
        description: "Lean protein",
        category: "lunch",
        calories: 350,
        protein: 45,
        carbs: 10,
        fat: 12,
        fiber: null,
        sugar: null,
        servingSize: "300g",
        price: 150,
        allergens: [],
        dietaryTags: ["high_protein"],
        imageUrl: null,
        active: true,
        posterProductId: null,
      });

      expect(result.name).toBe("Grilled Chicken");
      expect(result.id).toBe(mealRow.id);
    });

    it("throws when insert returns no rows", async () => {
      const db = buildDbMock([]);

      await expect(
        mealService.createMeal(db, {
          name: "X",
          description: "X",
          category: "lunch",
          calories: 100,
          protein: 10,
          carbs: 10,
          fat: 5,
          fiber: null,
          sugar: null,
          servingSize: "100g",
          price: 50,
          allergens: [],
          dietaryTags: [],
          imageUrl: null,
          active: true,
          posterProductId: null,
        })
      ).rejects.toThrow("Failed to create meal");
    });
  });

  describe("updateMeal", () => {
    it("updates and returns the modified meal", async () => {
      const updated = { ...mealRow, name: "Updated Chicken" };
      const db = buildDbMock([updated]);

      const result = await mealService.updateMeal(db, mealRow.id, {
        name: "Updated Chicken",
      });

      expect(result).not.toBeNull();
      expect(result!.name).toBe("Updated Chicken");
    });

    it("returns null when meal not found", async () => {
      const db = buildDbMock([]);

      const result = await mealService.updateMeal(db, "non-existent", {
        name: "X",
      });

      expect(result).toBeNull();
    });
  });

  describe("deleteMeal", () => {
    it("soft-deletes by setting active=false", async () => {
      const deactivated = { ...mealRow, active: false };
      const db = buildDbMock([deactivated]);

      const result = await mealService.deleteMeal(db, mealRow.id);

      expect(result).not.toBeNull();
      expect(result!.active).toBe(false);
    });

    it("returns null when meal not found", async () => {
      const db = buildDbMock([]);

      const result = await mealService.deleteMeal(db, "non-existent");

      expect(result).toBeNull();
    });
  });
});
