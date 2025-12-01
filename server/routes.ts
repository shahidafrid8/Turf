import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all turfs
  app.get("/api/turfs", async (req, res) => {
    try {
      const turfs = await storage.getTurfs();
      res.json(turfs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch turfs" });
    }
  });

  // Get a single turf
  app.get("/api/turfs/:id", async (req, res) => {
    try {
      const turf = await storage.getTurf(req.params.id);
      if (!turf) {
        return res.status(404).json({ error: "Turf not found" });
      }
      res.json(turf);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch turf" });
    }
  });

  // Get time slots for a turf and date
  app.get("/api/turfs/:id/slots/:date", async (req, res) => {
    try {
      const slots = await storage.getTimeSlots(req.params.id, req.params.date);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time slots" });
    }
  });

  // Get all bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Get a single booking
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  // Create a new booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Booking creation error:", error);
      res.status(400).json({ error: "Invalid booking data" });
    }
  });

  return httpServer;
}
