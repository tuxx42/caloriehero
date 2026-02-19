import { eq } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { userProfiles, type UserProfileRow } from "../db/schema/index.js";
import type { UpdateProfileRequest } from "@caloriehero/shared-types";

function rowToProfile(row: UserProfileRow) {
  return {
    userId: row.userId,
    macroTargets: row.macroTargets as {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    },
    fitnessGoal: row.fitnessGoal,
    allergies: (row.allergies as string[]) ?? [],
    dietaryPreferences: (row.dietaryPreferences as string[]) ?? [],
    deliveryAddress: row.deliveryAddress ?? undefined,
    deliveryLat: row.deliveryLat ?? undefined,
    deliveryLng: row.deliveryLng ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getProfile(db: Database, userId: string) {
  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  if (!row) return null;
  return rowToProfile(row);
}

export async function upsertProfile(
  db: Database,
  userId: string,
  data: UpdateProfileRequest
) {
  // Check if profile exists
  const existing = await getProfile(db, userId);

  if (existing) {
    // Update
    const [row] = await db
      .update(userProfiles)
      .set({
        ...(data.macroTargets !== undefined && {
          macroTargets: data.macroTargets,
        }),
        ...(data.fitnessGoal !== undefined && {
          fitnessGoal: data.fitnessGoal,
        }),
        ...(data.allergies !== undefined && { allergies: data.allergies }),
        ...(data.dietaryPreferences !== undefined && {
          dietaryPreferences: data.dietaryPreferences,
        }),
        ...(data.deliveryAddress !== undefined && {
          deliveryAddress: data.deliveryAddress,
        }),
        ...(data.deliveryLat !== undefined && {
          deliveryLat: data.deliveryLat,
        }),
        ...(data.deliveryLng !== undefined && {
          deliveryLng: data.deliveryLng,
        }),
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning();
    if (!row) throw new Error("Failed to update profile");
    return rowToProfile(row);
  }

  // Create — macroTargets and fitnessGoal are required for creation
  if (!data.macroTargets || !data.fitnessGoal) {
    throw Object.assign(new Error("macroTargets and fitnessGoal are required to create a profile"), {
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  }

  const [row] = await db
    .insert(userProfiles)
    .values({
      userId,
      macroTargets: data.macroTargets,
      fitnessGoal: data.fitnessGoal,
      allergies: data.allergies ?? [],
      dietaryPreferences: data.dietaryPreferences ?? [],
      deliveryAddress: data.deliveryAddress ?? null,
      deliveryLat: data.deliveryLat ?? null,
      deliveryLng: data.deliveryLng ?? null,
    })
    .returning();

  if (!row) throw new Error("Failed to create profile");
  return rowToProfile(row);
}
