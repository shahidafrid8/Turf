import { 
  type User, type InsertUser,
  type Turf, type InsertTurf,
  type TimeSlot, type InsertTimeSlot,
  type Booking, type InsertBooking
} from "@shared/schema";
import { randomUUID } from "crypto";
import { addDays, format, startOfToday } from "date-fns";
import { DatabaseStorage } from "./dbStorage";

export interface IStorage {
  // Cities
  getCities(): Promise<string[]>;
  addCity(city: string): Promise<string[]>;
  deleteCity(city: string): Promise<string[]>;
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: string, role: string, ownerStatus?: string): Promise<User | undefined>;
  getPendingOwners(): Promise<User[]>;
  approveOwner(username: string): Promise<User | undefined>;
  rejectOwner(username: string): Promise<User | undefined>;
  // Turfs
  getTurfs(): Promise<Turf[]>;
  getTurf(id: string): Promise<Turf | undefined>;
  getTurfsByOwner(ownerId: string): Promise<Turf[]>;
  getPendingTurfs(): Promise<Turf[]>;
  getAllTurfs(): Promise<Turf[]>;
  createTurf(turf: InsertTurf): Promise<Turf>;
  approveTurf(id: string): Promise<Turf | undefined>;
  rejectTurf(id: string): Promise<Turf | undefined>;
  // Images
  storeImage(data: string, mimeType: string): Promise<string>;
  getImage(id: string): Promise<{ data: string; mimeType: string } | undefined>;
  // Time Slots
  getTimeSlots(turfId: string, date: string): Promise<TimeSlot[]>;
  getTimeSlot(id: string): Promise<TimeSlot | undefined>;
  createTimeSlot(slot: InsertTimeSlot): Promise<TimeSlot>;
  bookTimeSlot(id: string): Promise<TimeSlot | undefined>;
  // Bookings
  getBookings(): Promise<Booking[]>;
  getBookingsByUser(userId: string): Promise<Booking[]>;
  getBookingsByTurf(turfId: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingByCode(code: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
}



function generateTimeSlots(turfId: string, date: string, basePrice: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const morningTimes = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00"];
  morningTimes.forEach((time, index) => {
    const endHour = parseInt(time.split(":")[0]) + 1;
    slots.push({ id: `${turfId}-${date}-morning-${index}`, turfId, date, startTime: time, endTime: `${endHour.toString().padStart(2, "0")}:00`, price: basePrice, period: "morning", isBooked: false });
  });
  const afternoonTimes = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  afternoonTimes.forEach((time, index) => {
    const endHour = parseInt(time.split(":")[0]) + 1;
    slots.push({ id: `${turfId}-${date}-afternoon-${index}`, turfId, date, startTime: time, endTime: `${endHour.toString().padStart(2, "0")}:00`, price: Math.round(basePrice * 1.2), period: "afternoon", isBooked: false });
  });
  const eveningTimes = ["18:00", "19:00", "20:00", "21:00", "22:00"];
  eveningTimes.forEach((time, index) => {
    const endHour = parseInt(time.split(":")[0]) + 1;
    slots.push({ id: `${turfId}-${date}-evening-${index}`, turfId, date, startTime: time, endTime: `${endHour.toString().padStart(2, "0")}:00`, price: Math.round(basePrice * 1.5), period: "evening", isBooked: false });
  });
  return slots;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private turfs: Map<string, Turf> = new Map();
  private timeSlots: Map<string, TimeSlot> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private images: Map<string, { data: string; mimeType: string }> = new Map();
  private cities: string[] = [
    'Ahmedabad', 'Bangalore', 'Chennai', 'Coimbatore', 'Delhi',
    'Guntur', 'Hyderabad', 'Indore', 'Jaipur', 'Kochi',
    'Kolkata', 'Kurnool', 'Mumbai', 'Nagpur', 'Nandyal',
    'Pune', 'Surat', 'Tirupati', 'Vijayawada', 'Visakhapatnam',
  ];

  constructor() {
    // No seed data — turfs are added by owners and approved by admin
  }

  async storeImage(data: string, mimeType: string): Promise<string> {
    const id = randomUUID();
    this.images.set(id, { data, mimeType });
    return id;
  }
  async getImage(id: string): Promise<{ data: string; mimeType: string } | undefined> {
    return this.images.get(id);
  }

  async getCities(): Promise<string[]> { return [...this.cities].sort(); }
  async addCity(city: string): Promise<string[]> {
    const normalized = city.trim();
    if (normalized && !this.cities.some(c => c.toLowerCase() === normalized.toLowerCase())) {
      this.cities.push(normalized);
    }
    return [...this.cities].sort();
  }
  async deleteCity(city: string): Promise<string[]> {
    this.cities = this.cities.filter(c => c.toLowerCase() !== city.toLowerCase());
    return [...this.cities].sort();
  }

  async getUser(id: string) { return this.users.get(id); }
  async getUserByUsername(username: string) { return Array.from(this.users.values()).find(u => u.username === username); }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { id, username: insertUser.username, password: insertUser.password, fullName: insertUser.fullName ?? null, role: insertUser.role ?? "user", ownerStatus: insertUser.ownerStatus ?? "none" };
    this.users.set(id, user);
    return user;
  }
  async updateUserRole(id: string, role: string, ownerStatus?: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    user.role = role;
    if (ownerStatus !== undefined) user.ownerStatus = ownerStatus;
    this.users.set(id, user);
    return user;
  }

  async getPendingOwners(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.role === 'owner' && u.ownerStatus === 'pending');
  }

  async approveOwner(username: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(u => u.username === username);
    if (!user) return undefined;
    user.ownerStatus = 'approved';
    this.users.set(user.id, user);
    return user;
  }

  async rejectOwner(username: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(u => u.username === username);
    if (!user) return undefined;
    user.ownerStatus = 'rejected';
    this.users.set(user.id, user);
    return user;
  }

  async getTurfs() { return Array.from(this.turfs.values()).filter(t => t.verified && t.approvalStatus === "approved"); }
  async getTurf(id: string) { return this.turfs.get(id); }
  async getTurfsByOwner(ownerId: string) { return Array.from(this.turfs.values()).filter(t => t.ownerId === ownerId); }
  async getPendingTurfs() { return Array.from(this.turfs.values()).filter(t => t.approvalStatus === "pending"); }
  async getAllTurfs() { return Array.from(this.turfs.values()); }

  async createTurf(insertTurf: InsertTurf): Promise<Turf> {
    const id = randomUUID();
    const turf: Turf = { ...insertTurf, id, verified: false, approvalStatus: "pending", rating: insertTurf.rating ?? 0, isAvailable: insertTurf.isAvailable ?? true, featured: false, city: insertTurf.city ?? "", ownerId: insertTurf.ownerId ?? null, openingTime: insertTurf.openingTime ?? "06:00", closingTime: insertTurf.closingTime ?? "23:00", submittedAt: new Date() };
    this.turfs.set(id, turf);
    return turf;
  }

  async approveTurf(id: string): Promise<Turf | undefined> {
    const turf = this.turfs.get(id);
    if (!turf) return undefined;
    turf.verified = true;
    turf.approvalStatus = "approved";
    this.turfs.set(id, turf);
    const today = startOfToday();
    for (let i = 0; i < 14; i++) {
      const date = format(addDays(today, i), "yyyy-MM-dd");
      generateTimeSlots(turf.id, date, turf.pricePerHour).forEach(slot => this.timeSlots.set(slot.id, slot));
    }
    return turf;
  }

  async rejectTurf(id: string): Promise<Turf | undefined> {
    const turf = this.turfs.get(id);
    if (!turf) return undefined;
    turf.verified = false;
    turf.approvalStatus = "rejected";
    this.turfs.set(id, turf);
    return turf;
  }

  async getTimeSlots(turfId: string, date: string) { return Array.from(this.timeSlots.values()).filter(s => s.turfId === turfId && s.date === date); }
  async getTimeSlot(id: string) { return this.timeSlots.get(id); }
  async createTimeSlot(insertSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = randomUUID();
    const slot: TimeSlot = { ...insertSlot, id, isBooked: insertSlot.isBooked ?? false };
    this.timeSlots.set(id, slot);
    return slot;
  }
  async bookTimeSlot(id: string): Promise<TimeSlot | undefined> {
    const slot = this.timeSlots.get(id);
    if (slot) { slot.isBooked = true; this.timeSlots.set(id, slot); }
    return slot;
  }

  async getBookings() { return Array.from(this.bookings.values()); }
  async getBookingsByUser(userId: string) { return Array.from(this.bookings.values()).filter(b => b.userId === userId); }
  async getBookingsByTurf(turfId: string) { return Array.from(this.bookings.values()).filter(b => b.turfId === turfId); }
  async getBooking(id: string) { return this.bookings.get(id); }
  async getBookingByCode(code: string) { return Array.from(this.bookings.values()).find(b => b.bookingCode === code); }
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const startH = parseInt(insertBooking.startTime.split(':')[0]);
    const durationHours = insertBooking.duration / 60;
    const endH = startH + durationHours;

    // Check for conflicts across all slots covered by the duration
    for (const slot of this.timeSlots.values()) {
      if (slot.turfId === insertBooking.turfId && slot.date === insertBooking.date) {
        const slotH = parseInt(slot.startTime.split(':')[0]);
        if (slotH >= startH && slotH < endH && slot.isBooked) {
          throw new Error(`Slot at ${slot.startTime} is already booked.`);
        }
      }
    }

    // Mark every 1-hour slot covered by the booking as booked
    for (const slot of this.timeSlots.values()) {
      if (slot.turfId === insertBooking.turfId && slot.date === insertBooking.date) {
        const slotH = parseInt(slot.startTime.split(':')[0]);
        if (slotH >= startH && slotH < endH) {
          slot.isBooked = true;
          this.timeSlots.set(slot.id, slot);
        }
      }
    }

    const id = randomUUID();
    const booking: Booking = { ...insertBooking, id, createdAt: new Date(), status: insertBooking.status ?? 'confirmed' };
    this.bookings.set(id, booking);
    return booking;
  }
}

export const storage = new DatabaseStorage();
