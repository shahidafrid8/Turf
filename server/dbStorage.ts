import { eq, and, sql } from "drizzle-orm";
import { addDays, format, startOfToday } from "date-fns";
import { randomUUID } from "crypto";
import { getDb } from "./db";
import {
  users, turfs, timeSlots, bookings,
  images as imagesTable, cities as citiesTable,
  type User, type InsertUser,
  type Turf, type InsertTurf,
  type TimeSlot, type InsertTimeSlot,
  type Booking, type InsertBooking,
} from "@shared/schema";
import type { IStorage } from "./storage";

const DEFAULT_CITIES = [
  "Ahmedabad", "Bangalore", "Chennai", "Coimbatore", "Delhi",
  "Guntur", "Hyderabad", "Indore", "Jaipur", "Kochi",
  "Kolkata", "Kurnool", "Mumbai", "Nagpur", "Nandyal",
  "Pune", "Surat", "Tirupati", "Vijayawada", "Visakhapatnam",
];

function generateSlots(turfId: string, date: string, basePrice: number): (InsertTimeSlot & { id: string })[] {
  const slots: (InsertTimeSlot & { id: string })[] = [];
  ["06:00","07:00","08:00","09:00","10:00","11:00"].forEach((t, i) => {
    slots.push({ id: `${turfId}-${date}-m${i}`, turfId, date, startTime: t, endTime: `${String(parseInt(t)+1).padStart(2,"0")}:00`, price: basePrice, period: "morning", isBooked: false });
  });
  ["12:00","13:00","14:00","15:00","16:00","17:00"].forEach((t, i) => {
    slots.push({ id: `${turfId}-${date}-a${i}`, turfId, date, startTime: t, endTime: `${String(parseInt(t)+1).padStart(2,"0")}:00`, price: Math.round(basePrice*1.2), period: "afternoon", isBooked: false });
  });
  ["18:00","19:00","20:00","21:00","22:00"].forEach((t, i) => {
    slots.push({ id: `${turfId}-${date}-e${i}`, turfId, date, startTime: t, endTime: `${String(parseInt(t)+1).padStart(2,"0")}:00`, price: Math.round(basePrice*1.5), period: "evening", isBooked: false });
  });
  return slots;
}

export class DatabaseStorage implements IStorage {
  private d() { return getDb(); }

  async getCities(): Promise<string[]> {
    let rows = await this.d().select().from(citiesTable).orderBy(citiesTable.name);
    if (rows.length === 0) {
      await this.d().insert(citiesTable).values(DEFAULT_CITIES.map(name => ({ name }))).onConflictDoNothing();
      rows = await this.d().select().from(citiesTable).orderBy(citiesTable.name);
    }
    return rows.map(r => r.name);
  }
  async addCity(city: string): Promise<string[]> {
    const n = city.trim();
    if (n) await this.d().insert(citiesTable).values({ name: n }).onConflictDoNothing();
    return this.getCities();
  }
  async deleteCity(city: string): Promise<string[]> {
    await this.d().delete(citiesTable).where(sql`lower(${citiesTable.name}) = lower(${city})`);
    return this.getCities();
  }

  async storeImage(data: string, mimeType: string): Promise<string> {
    const id = randomUUID();
    await this.d().insert(imagesTable).values({ id, data, mimeType });
    return id;
  }
  async getImage(id: string): Promise<{ data: string; mimeType: string } | undefined> {
    const [row] = await this.d().select().from(imagesTable).where(eq(imagesTable.id, id));
    return row ?? undefined;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [u] = await this.d().select().from(users).where(eq(users.id, id));
    return u ?? undefined;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [u] = await this.d().select().from(users).where(eq(users.username, username));
    return u ?? undefined;
  }
  async createUser(ins: InsertUser): Promise<User> {
    const [u] = await this.d().insert(users).values({ id: randomUUID(), username: ins.username, password: ins.password, fullName: ins.fullName ?? null, role: ins.role ?? "user", ownerStatus: ins.ownerStatus ?? "none" }).returning();
    return u;
  }
  async updateUserRole(id: string, role: string, ownerStatus?: string): Promise<User | undefined> {
    const upd: Partial<User> = { role };
    if (ownerStatus !== undefined) upd.ownerStatus = ownerStatus;
    const [u] = await this.d().update(users).set(upd).where(eq(users.id, id)).returning();
    return u ?? undefined;
  }
  async getPendingOwners(): Promise<User[]> {
    return this.d().select().from(users).where(and(eq(users.role, "owner"), eq(users.ownerStatus, "pending")));
  }
  async approveOwner(username: string): Promise<User | undefined> {
    const [u] = await this.d().update(users).set({ ownerStatus: "approved" }).where(eq(users.username, username)).returning();
    return u ?? undefined;
  }
  async rejectOwner(username: string): Promise<User | undefined> {
    const [u] = await this.d().update(users).set({ ownerStatus: "rejected" }).where(eq(users.username, username)).returning();
    return u ?? undefined;
  }

  async getTurfs(): Promise<Turf[]> {
    return this.d().select().from(turfs).where(and(eq(turfs.verified, true), eq(turfs.approvalStatus, "approved")));
  }
  async getTurf(id: string): Promise<Turf | undefined> {
    const [t] = await this.d().select().from(turfs).where(eq(turfs.id, id));
    return t ?? undefined;
  }
  async getTurfsByOwner(ownerId: string): Promise<Turf[]> {
    return this.d().select().from(turfs).where(eq(turfs.ownerId, ownerId));
  }
  async getPendingTurfs(): Promise<Turf[]> {
    return this.d().select().from(turfs).where(eq(turfs.approvalStatus, "pending"));
  }
  async getAllTurfs(): Promise<Turf[]> {
    return this.d().select().from(turfs);
  }
  async createTurf(ins: InsertTurf): Promise<Turf> {
    const [t] = await this.d().insert(turfs).values({ ...ins, id: randomUUID(), verified: false, approvalStatus: "pending", rating: ins.rating ?? 0, isAvailable: ins.isAvailable ?? true, featured: false, city: ins.city ?? "", ownerId: ins.ownerId ?? null, openingTime: ins.openingTime ?? "06:00", closingTime: ins.closingTime ?? "23:00" }).returning();
    return t;
  }
  async approveTurf(id: string): Promise<Turf | undefined> {
    const [t] = await this.d().update(turfs).set({ verified: true, approvalStatus: "approved" }).where(eq(turfs.id, id)).returning();
    if (!t) return undefined;
    const today = startOfToday();
    for (let i = 0; i < 14; i++) {
      const date = format(addDays(today, i), "yyyy-MM-dd");
      await this.d().insert(timeSlots).values(generateSlots(t.id, date, t.pricePerHour)).onConflictDoNothing();
    }
    return t;
  }
  async rejectTurf(id: string): Promise<Turf | undefined> {
    const [t] = await this.d().update(turfs).set({ verified: false, approvalStatus: "rejected" }).where(eq(turfs.id, id)).returning();
    return t ?? undefined;
  }

  async getTimeSlots(turfId: string, date: string): Promise<TimeSlot[]> {
    return this.d().select().from(timeSlots).where(and(eq(timeSlots.turfId, turfId), eq(timeSlots.date, date)));
  }
  async getTimeSlot(id: string): Promise<TimeSlot | undefined> {
    const [s] = await this.d().select().from(timeSlots).where(eq(timeSlots.id, id));
    return s ?? undefined;
  }
  async createTimeSlot(ins: InsertTimeSlot): Promise<TimeSlot> {
    const [s] = await this.d().insert(timeSlots).values({ ...ins, id: randomUUID(), isBooked: ins.isBooked ?? false }).returning();
    return s;
  }
  async bookTimeSlot(id: string): Promise<TimeSlot | undefined> {
    const [s] = await this.d().update(timeSlots).set({ isBooked: true }).where(eq(timeSlots.id, id)).returning();
    return s ?? undefined;
  }

  async getBookings(): Promise<Booking[]> {
    return this.d().select().from(bookings);
  }
  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return this.d().select().from(bookings).where(eq(bookings.userId, userId));
  }
  async getBookingsByTurf(turfId: string): Promise<Booking[]> {
    return this.d().select().from(bookings).where(eq(bookings.turfId, turfId));
  }
  async getBooking(id: string): Promise<Booking | undefined> {
    const [b] = await this.d().select().from(bookings).where(eq(bookings.id, id));
    return b ?? undefined;
  }
  async getBookingByCode(code: string): Promise<Booking | undefined> {
    const [b] = await this.d().select().from(bookings).where(eq(bookings.bookingCode, code));
    return b ?? undefined;
  }
  async createBooking(ins: InsertBooking): Promise<Booking> {
    const startH = parseInt(ins.startTime.split(":")[0]);
    const endH = startH + ins.duration / 60;
    return this.d().transaction(async (tx) => {
      const existing = await tx.select().from(timeSlots).where(and(eq(timeSlots.turfId, ins.turfId), eq(timeSlots.date, ins.date)));
      for (const slot of existing) {
        const slotH = parseInt(slot.startTime.split(":")[0]);
        if (slotH >= startH && slotH < endH && slot.isBooked) throw new Error(`Slot at ${slot.startTime} is already booked.`);
      }
      for (const slot of existing) {
        const slotH = parseInt(slot.startTime.split(":")[0]);
        if (slotH >= startH && slotH < endH) await tx.update(timeSlots).set({ isBooked: true }).where(eq(timeSlots.id, slot.id));
      }
      const [b] = await tx.insert(bookings).values({ ...ins, id: randomUUID(), status: ins.status ?? "confirmed" }).returning();
      return b;
    });
  }
}
