import { eq, and, type SQL } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { meals, type MealRow, type NewMealRow } from "../db/schema/index.js";

export interface ListMealsOptions {
  category?: string;
  active?: boolean;
}

export type CreateMealData = Omit<NewMealRow, "id" | "createdAt" | "updatedAt">;
export type UpdateMealData = Partial<CreateMealData>;

function rowToMeal(row: MealRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    nutritionalInfo: {
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      fiber: row.fiber ?? undefined,
      sugar: row.sugar ?? undefined,
    },
    servingSize: row.servingSize,
    price: row.price,
    allergens: (row.allergens as string[]) ?? [],
    dietaryTags: (row.dietaryTags as string[]) ?? [],
    imageUrl: row.imageUrl ?? undefined,
    active: row.active,
    posterProductId: row.posterProductId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listMeals(db: Database, opts?: ListMealsOptions) {
  const conditions: SQL[] = [];

  if (opts?.category !== undefined) {
    conditions.push(eq(meals.category, opts.category));
  }

  if (opts?.active !== undefined) {
    conditions.push(eq(meals.active, opts.active));
  }

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(meals)
          .where(and(...conditions))
      : await db.select().from(meals);

  return rows.map(rowToMeal);
}

export async function getMeal(db: Database, id: string) {
  const [row] = await db.select().from(meals).where(eq(meals.id, id)).limit(1);
  if (!row) return null;
  return rowToMeal(row);
}

export async function createMeal(db: Database, data: CreateMealData) {
  const [row] = await db.insert(meals).values(data).returning();
  if (!row) throw new Error("Failed to create meal");
  return rowToMeal(row);
}

export async function updateMeal(
  db: Database,
  id: string,
  data: UpdateMealData
) {
  const [row] = await db
    .update(meals)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(meals.id, id))
    .returning();
  if (!row) return null;
  return rowToMeal(row);
}

export async function deleteMeal(db: Database, id: string) {
  const [row] = await db
    .update(meals)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(meals.id, id))
    .returning();
  if (!row) return null;
  return rowToMeal(row);
}
