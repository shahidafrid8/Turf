import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { turfs, timeSlots } from "./shared/schema";
import { addDays, format, startOfToday } from "date-fns";

// Initialize database connection
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

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
const initialTurfs = [
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
];

// Generate time slots for a turf and date
function generateTimeSlots(turfId: string, date: string, basePrice: number) {
  const slots = [];

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

async function seedDatabase() {
  console.log("Seeding database...");

  // Insert turfs
  for (const turf of initialTurfs) {
    await db.insert(turfs).values(turf);
    console.log(`Inserted turf: ${turf.name}`);
  }

  // Generate time slots for the next 14 days
  const today = startOfToday();
  for (const turf of initialTurfs) {
    for (let i = 0; i < 14; i++) {
      const date = format(addDays(today, i), "yyyy-MM-dd");
      const slots = generateTimeSlots(turf.id, date, turf.pricePerHour);
      for (const slot of slots) {
        await db.insert(timeSlots).values(slot);
      }
    }
    console.log(`Generated time slots for: ${turf.name}`);
  }

  console.log("Database seeded successfully!");
  process.exit(0);
}

seedDatabase().catch(console.error);