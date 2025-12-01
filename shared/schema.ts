import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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
});

export const insertTurfSchema = createInsertSchema(turfs).omit({ id: true });
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
