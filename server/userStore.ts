/**
 * UserStore: Persistent user-specific data via Drizzle ORM + Supabase PostgreSQL.
 * Tables: user_preferences, user_payment_methods, reviews
 * When DATABASE_URL is not set, methods return empty/throw with a clear message.
 */

import { eq, and } from "drizzle-orm";
import {
  userPreferences, userPaymentMethods, reviews,
  type UserPaymentMethod, type InsertPaymentMethod,
  type Review, type InsertReview,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Lazily initialise so the server starts even without DATABASE_URL
type DrizzleDb = ReturnType<typeof drizzle>;
let _db: DrizzleDb | null = null;
let _tried = false;

function getDb(): DrizzleDb | null {
  if (_tried) return _db;
  _tried = true;
  if (!process.env.DATABASE_URL) {
    console.warn("[userStore] DATABASE_URL not set — user data won't persist.");
    return null;
  }
  try {
    const client = postgres(process.env.DATABASE_URL, { ssl: "require", max: 5 });
    _db = drizzle(client);
  } catch (e) {
    console.error("[userStore] Failed to connect to DB:", e);
  }
  return _db;
}

export const isDatabaseAvailable = () => !!getDb();

// ─── PREFERENCES ─────────────────────────────────────────────────────────────

export async function getPreferences(userId: string): Promise<{
  notifPrefs: Record<string, boolean>;
  privacyPrefs: Record<string, boolean>;
} | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  if (!rows.length) return null;
  return {
    notifPrefs: (rows[0].notifPrefs as Record<string, boolean>) ?? {},
    privacyPrefs: (rows[0].privacyPrefs as Record<string, boolean>) ?? {},
  };
}

export async function savePreferences(
  userId: string,
  updates: { notifPrefs?: Record<string, boolean>; privacyPrefs?: Record<string, boolean> },
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not configured. Set DATABASE_URL in your .env file.");
  const existing = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  if (existing.length) {
    const patch: Record<string, any> = { updatedAt: new Date() };
    if (updates.notifPrefs !== undefined) patch.notifPrefs = updates.notifPrefs;
    if (updates.privacyPrefs !== undefined) patch.privacyPrefs = updates.privacyPrefs;
    await db.update(userPreferences).set(patch).where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({
      userId,
      notifPrefs: updates.notifPrefs ?? {},
      privacyPrefs: updates.privacyPrefs ?? {},
    });
  }
}

// ─── PAYMENT METHODS ─────────────────────────────────────────────────────────

export async function getPaymentMethods(userId: string): Promise<UserPaymentMethod[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(userPaymentMethods).where(eq(userPaymentMethods.userId, userId));
}

export async function addPaymentMethod(method: InsertPaymentMethod): Promise<UserPaymentMethod> {
  const db = getDb();
  if (!db) throw new Error("Database not configured.");
  if (method.isDefault) {
    await db.update(userPaymentMethods).set({ isDefault: false }).where(eq(userPaymentMethods.userId, method.userId));
  }
  const rows = await db.insert(userPaymentMethods).values(method).returning();
  return rows[0];
}

export async function removePaymentMethod(userId: string, id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not configured.");
  await db.delete(userPaymentMethods).where(and(eq(userPaymentMethods.id, id), eq(userPaymentMethods.userId, userId)));
}

export async function setDefaultPaymentMethod(userId: string, id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not configured.");
  await db.update(userPaymentMethods).set({ isDefault: false }).where(eq(userPaymentMethods.userId, userId));
  await db.update(userPaymentMethods).set({ isDefault: true }).where(and(eq(userPaymentMethods.id, id), eq(userPaymentMethods.userId, userId)));
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

export async function addReview(review: InsertReview): Promise<Review> {
  const db = getDb();
  if (!db) throw new Error("Database not configured.");
  const rows = await db.insert(reviews).values(review).returning();
  return rows[0];
}

export async function getUserReview(userId: string): Promise<Review | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(reviews).where(eq(reviews.userId, userId)).limit(1);
  return rows[0] ?? null;
}
