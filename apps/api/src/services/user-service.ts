import { eq } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { users, type UserRow } from "../db/schema/index.js";

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

function rowToUser(row: UserRow) {
  return {
    id: row.id,
    googleId: row.googleId,
    email: row.email,
    name: row.name,
    isAdmin: row.isAdmin,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findOrCreateUser(
  db: Database,
  profile: GoogleProfile
) {
  // Try to find existing user by googleId
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, profile.googleId))
    .limit(1);

  if (existing) {
    return rowToUser(existing);
  }

  // Create new user
  const [created] = await db
    .insert(users)
    .values({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
    })
    .returning();

  if (!created) throw new Error("Failed to create user");
  return rowToUser(created);
}

export async function getUser(db: Database, id: string) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!row) return null;
  return rowToUser(row);
}
