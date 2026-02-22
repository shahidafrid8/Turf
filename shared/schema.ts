import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles: 'user' | 'owner' | 'admin'
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role").notNull().default("user"), // 'user' | 'owner' | 'admin'
  ownerStatus: text("owner_status").default("none"), // 'none' | 'pending' | 'approved' | 'rejected'
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  ownerStatus: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Turf model
export const turfs = pgTable("turfs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
  imageUrl: text("image_url").notNull(),
  rating: integer("rating").notNull().default(5),
  amenities: text("amenities").array().notNull(),
  sportTypes: text("sport_types").array().notNull(),
  pricePerHour: integer("price_per_hour").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  city: text("city").notNull().default(""),
  // Owner & approval fields
  ownerId: varchar("owner_id"),
  verified: boolean("verified").notNull().default(false),
  approvalStatus: text("approval_status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  openingTime: text("opening_time").notNull().default("06:00"),
  closingTime: text("closing_time").notNull().default("23:00"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertTurfSchema = createInsertSchema(turfs).omit({ id: true, submittedAt: true });
export type InsertTurf = z.infer<typeof insertTurfSchema>;
export type Turf = typeof turfs.$inferSelect;

// Time slot model
export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  turfId: varchar("turf_id").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  price: integer("price").notNull(),
  period: text("period").notNull(), // morning, afternoon, evening
  isBooked: boolean("is_booked").notNull().default(false),
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({ id: true });
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;

// Booking model
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"), // Supabase auth user UUID
  turfId: varchar("turf_id").notNull(),
  turfName: text("turf_name").notNull(),
  turfAddress: text("turf_address").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  duration: integer("duration").notNull(), // in minutes
  totalAmount: integer("total_amount").notNull(),
  paidAmount: integer("paid_amount").notNull(),
  balanceAmount: integer("balance_amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("confirmed"),
  bookingCode: text("booking_code").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// ── USER PREFERENCES ──────────────────────────────────────────────────────
export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id").primaryKey(), // Supabase auth UUID
  notifPrefs: json("notif_prefs").$type<Record<string, boolean>>(),
  privacyPrefs: json("privacy_prefs").$type<Record<string, boolean>>(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type UserPreferences = typeof userPreferences.$inferSelect;

// ── USER PAYMENT METHODS ───────────────────────────────────────────────────
export const userPaymentMethods = pgTable("user_payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'upi' | 'card' | 'wallet'
  label: text("label").notNull(),
  detail: text("detail").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPaymentMethodSchema = createInsertSchema(userPaymentMethods).omit({ id: true, createdAt: true });
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type UserPaymentMethod = typeof userPaymentMethods.$inferSelect;

// ── REVIEWS ────────────────────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  turfId: text("turf_id"), // null = app-level review
  overallStars: integer("overall_stars").notNull(),
  aspectRatings: json("aspect_ratings").$type<Record<string, number>>(),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// ── IMAGES ─────────────────────────────────────────────────────────────────
export const images = pgTable("images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  data: text("data").notNull(),        // base64 encoded
  mimeType: text("mime_type").notNull(),
});

// ── CITIES ─────────────────────────────────────────────────────────────────
export const cities = pgTable("cities", {
  name: text("name").primaryKey(),
});
