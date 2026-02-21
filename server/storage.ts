import { 
  type User, type InsertUser,
  type Turf, type InsertTurf,
  type TimeSlot, type InsertTimeSlot,
  type Booking, type InsertBooking
} from "@shared/schema";
import { supabase } from "./index";
import { randomUUID } from "crypto";
import { addDays, format, startOfToday } from "date-fns";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Turfs
  getTurfs(): Promise<Turf[]>;
  getTurf(id: string): Promise<Turf | undefined>;
  createTurf(turf: InsertTurf): Promise<Turf>;
  
  // Time Slots
  getTimeSlots(turfId: string, date: string): Promise<TimeSlot[]>;
  getTimeSlot(id: string): Promise<TimeSlot | undefined>;
  createTimeSlot(slot: InsertTimeSlot): Promise<TimeSlot>;
  bookTimeSlot(id: string): Promise<TimeSlot | undefined>;
  
  // Bookings
  getBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
}

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    await db.insert(users).values(user);
    return user;
  }

  // Turfs
  async getTurfs(): Promise<Turf[]> {
    try {
      console.log("Fetching turfs from Supabase...");
      const { data, error } = await supabase
        .from('turfs')
        .select('*');
      
      if (error) throw error;
      console.log("Fetched turfs:", data?.length || 0);
      return data || [];
    } catch (error) {
      console.error("Database error in getTurfs:", error);
      throw error;
    }
  }

  async getTurf(id: string): Promise<Turf | undefined> {
    const result = await db.select().from(turfs).where(eq(turfs.id, id));
    return result[0];
  }

  async createTurf(insertTurf: InsertTurf): Promise<Turf> {
    const id = randomUUID();
    const turf: Turf = { ...insertTurf, id };
    await db.insert(turfs).values(turf);
    return turf;
  }

  // Time Slots
  async getTimeSlots(turfId: string, date: string): Promise<TimeSlot[]> {
    return await db.select().from(timeSlots).where(
      and(eq(timeSlots.turfId, turfId), eq(timeSlots.date, date))
    );
  }

  async getTimeSlot(id: string): Promise<TimeSlot | undefined> {
    const result = await db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return result[0];
  }

  async createTimeSlot(insertSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = randomUUID();
    const slot: TimeSlot = { ...insertSlot, id };
    await db.insert(timeSlots).values(slot);
    return slot;
  }

  async bookTimeSlot(id: string): Promise<TimeSlot | undefined> {
    const result = await db
      .update(timeSlots)
      .set({ isBooked: true })
      .where(eq(timeSlots.id, id))
      .returning();
    return result[0];
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { 
      ...insertBooking, 
      id,
      createdAt: new Date(),
    };
    await db.insert(bookings).values(booking);
    return booking;
  }
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Turfs
  getTurfs(): Promise<Turf[]>;
  getTurf(id: string): Promise<Turf | undefined>;
  createTurf(turf: InsertTurf): Promise<Turf>;
  
  // Time Slots
  getTimeSlots(turfId: string, date: string): Promise<TimeSlot[]>;
  getTimeSlot(id: string): Promise<TimeSlot | undefined>;
  createTimeSlot(slot: InsertTimeSlot): Promise<TimeSlot>;
  bookTimeSlot(id: string): Promise<TimeSlot | undefined>;
  
  // Bookings
  getBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
}

// Sample turf images from Unsplash
const turfImages = [
  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1624880357913-a8539238245b?w=800&h=600&fit=crop",
];

// Initial turfs data
const initialTurfs: Turf[] = [
  {
    id: "turf-1",
    name: "Green Valley Cricket Ground",
    location: "Indiranagar, Bangalore",
    address: "123 Sports Complex, Indiranagar, Bangalore 560038",
    imageUrl: turfImages[0],
    rating: 5,
    amenities: ["Parking", "WiFi", "Showers", "Changing Room"],
    sportTypes: ["Cricket"],
    pricePerHour: 1200,
    isAvailable: true,
    featured: true,
  },
  {
    id: "turf-2",
    name: "Champions Cricket Ground",
    location: "Koramangala, Bangalore",
    address: "456 Stadium Road, Koramangala, Bangalore 560034",
    imageUrl: turfImages[1],
    rating: 5,
    amenities: ["Parking", "WiFi", "Showers"],
    sportTypes: ["Cricket"],
    pricePerHour: 1500,
    isAvailable: true,
    featured: true,
  },
  {
    id: "turf-3",
    name: "Cricket Paradise",
    location: "HSR Layout, Bangalore",
    address: "789 Sports Avenue, HSR Layout, Bangalore 560102",
    imageUrl: turfImages[2],
    rating: 4,
    amenities: ["Parking", "Changing Room"],
    sportTypes: ["Cricket"],
    pricePerHour: 800,
    isAvailable: true,
    featured: false,
  },
  {
    id: "turf-4",
    name: "Elite Cricket Hub",
    location: "Whitefield, Bangalore",
    address: "101 Tech Park, Whitefield, Bangalore 560066",
    imageUrl: turfImages[3],
    rating: 4,
    amenities: ["Parking", "WiFi", "Showers", "Changing Room"],
    sportTypes: ["Cricket"],
    pricePerHour: 1000,
    isAvailable: true,
    featured: true,
  },
  {
    id: "turf-5",
    name: "Premier Cricket Arena",
    location: "Electronic City, Bangalore",
    address: "202 Sports Complex, Electronic City, Bangalore 560100",
    imageUrl: turfImages[4],
    rating: 5,
    amenities: ["Parking", "Showers"],
    sportTypes: ["Cricket"],
    pricePerHour: 2000,
    isAvailable: true,
    featured: true,
  },
  {
    id: "turf-6",
    name: "Professional Cricket Grounds",
    location: "MG Road, Bangalore",
    address: "303 Central Complex, MG Road, Bangalore 560001",
    imageUrl: turfImages[5],
    rating: 5,
    amenities: ["Parking", "WiFi", "Showers", "Changing Room"],
    sportTypes: ["Cricket"],
    pricePerHour: 1800,
    isAvailable: true,
    featured: false,
  },
];

// Generate time slots for a turf and date
function generateTimeSlots(turfId: string, date: string, basePrice: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Morning slots (6 AM - 12 PM) - Regular pricing
  const morningTimes = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00"];
  morningTimes.forEach((time, index) => {
    const endHour = parseInt(time.split(":")[0]) + 1;
    slots.push({
      id: `${turfId}-${date}-morning-${index}`,
      turfId,
      date,
      startTime: time,
      endTime: `${endHour.toString().padStart(2, "0")}:00`,
      price: basePrice,
      period: "morning",
      isBooked: Math.random() > 0.8,
    });
  });
  
  // Afternoon slots (12 PM - 6 PM) - Mid pricing
  const afternoonTimes = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  afternoonTimes.forEach((time, index) => {
    const endHour = parseInt(time.split(":")[0]) + 1;
    slots.push({
      id: `${turfId}-${date}-afternoon-${index}`,
      turfId,
      date,
      startTime: time,
      endTime: `${endHour.toString().padStart(2, "0")}:00`,
      price: Math.round(basePrice * 1.2),
      period: "afternoon",
      isBooked: Math.random() > 0.7,
    });
  });
  
  // Evening slots (6 PM - 11 PM) - Premium pricing
  const eveningTimes = ["18:00", "19:00", "20:00", "21:00", "22:00"];
  eveningTimes.forEach((time, index) => {
    const endHour = parseInt(time.split(":")[0]) + 1;
    slots.push({
      id: `${turfId}-${date}-evening-${index}`,
      turfId,
      date,
      startTime: time,
      endTime: `${endHour.toString().padStart(2, "0")}:00`,
      price: Math.round(basePrice * 1.5),
      period: "evening",
      isBooked: Math.random() > 0.6,
    });
  });
  
  return slots;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private turfs: Map<string, Turf>;
  private timeSlots: Map<string, TimeSlot>;
  private bookings: Map<string, Booking>;

  constructor() {
    this.users = new Map();
    this.turfs = new Map();
    this.timeSlots = new Map();
    this.bookings = new Map();
    
    // Initialize with sample turfs
    initialTurfs.forEach(turf => {
      this.turfs.set(turf.id, turf);
    });
    
    // Pre-generate time slots for the next 14 days
    const today = startOfToday();
    initialTurfs.forEach(turf => {
      for (let i = 0; i < 14; i++) {
        const date = format(addDays(today, i), "yyyy-MM-dd");
        const slots = generateTimeSlots(turf.id, date, turf.pricePerHour);
        slots.forEach(slot => {
          this.timeSlots.set(slot.id, slot);
        });
      }
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Turfs
  async getTurfs(): Promise<Turf[]> {
    return Array.from(this.turfs.values());
  }

  async getTurf(id: string): Promise<Turf | undefined> {
    return this.turfs.get(id);
  }

  async createTurf(insertTurf: InsertTurf): Promise<Turf> {
    const id = randomUUID();
    const turf: Turf = { ...insertTurf, id };
    this.turfs.set(id, turf);
    return turf;
  }

  // Time Slots
  async getTimeSlots(turfId: string, date: string): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values()).filter(
      (slot) => slot.turfId === turfId && slot.date === date
    );
  }

  async getTimeSlot(id: string): Promise<TimeSlot | undefined> {
    return this.timeSlots.get(id);
  }

  async createTimeSlot(insertSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = randomUUID();
    const slot: TimeSlot = { ...insertSlot, id };
    this.timeSlots.set(id, slot);
    return slot;
  }

  async bookTimeSlot(id: string): Promise<TimeSlot | undefined> {
    const slot = this.timeSlots.get(id);
    if (slot) {
      slot.isBooked = true;
      this.timeSlots.set(id, slot);
    }
    return slot;
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { 
      ...insertBooking, 
      id,
      createdAt: new Date(),
    };
    this.bookings.set(id, booking);
    return booking;
  }
}

export const storage = new DbStorage();
