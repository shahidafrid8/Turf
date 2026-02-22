import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertTurfSchema, insertPaymentMethodSchema, insertReviewSchema, admins } from "@shared/schema";
import { getDb, getSql } from "./db";
import { eq, sql } from "drizzle-orm";
import {
  getPreferences, savePreferences,
  getPaymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod,
  addReview, getUserReview, isDatabaseAvailable,
} from "./userStore";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── USER PROFILE (role management) ────────────────────────────────────────
  app.post("/api/users", async (req, res) => {
    try {
      const { username, password, fullName, role, ownerStatus } = req.body;
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(409).json({ error: "Username already exists" });
      const user = await storage.createUser({ username, password, fullName, role: role || "user", ownerStatus: ownerStatus || "none" });
      res.status(201).json(user);
    } catch (e) { res.status(400).json({ error: "Failed to create user" }); }
  });

  app.patch("/api/users/:id/role", async (req, res) => {
    try {
      const { role, ownerStatus } = req.body;
      const user = await storage.updateUserRole(req.params.id, role, ownerStatus);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (e) { res.status(400).json({ error: "Failed to update role" }); }
  });

  // ── CITIES ────────────────────────────────────────────────────────────────
  // Public: get all cities
  app.get("/api/cities", async (req, res) => {
    try { res.json(await storage.getCities()); }
    catch (e) { res.status(500).json({ error: "Failed to fetch cities" }); }
  });

  // Admin: add city
  app.post("/api/admin/cities", async (req, res) => {
    try {
      const { city } = req.body;
      if (!city) return res.status(400).json({ error: "City name required" });
      res.json(await storage.addCity(city));
    } catch (e) { res.status(500).json({ error: "Failed to add city" }); }
  });

  // Admin: delete city
  app.delete("/api/admin/cities/:city", async (req, res) => {
    try { res.json(await storage.deleteCity(decodeURIComponent(req.params.city))); }
    catch (e) { res.status(500).json({ error: "Failed to delete city" }); }
  });

  // ── PUBLIC TURF ROUTES ────────────────────────────────────────────────────
  app.get("/api/turfs", async (req, res) => {
    try {
      const turfs = await storage.getTurfs();
      const city = req.query.city as string | undefined;
      const result = city ? turfs.filter(t => t.city.toLowerCase() === city.toLowerCase()) : turfs;
      res.json(result);
    }
    catch (e) { res.status(500).json({ error: "Failed to fetch turfs" }); }
  });

  app.get("/api/turfs/:id", async (req, res) => {
    try {
      const turf = await storage.getTurf(req.params.id);
      if (!turf) return res.status(404).json({ error: "Turf not found" });
      res.json(turf);
    } catch (e) { res.status(500).json({ error: "Failed to fetch turf" }); }
  });

  app.get("/api/turfs/:id/slots/:date", async (req, res) => {
    try { res.json(await storage.getTimeSlots(req.params.id, req.params.date)); }
    catch (e) { res.status(500).json({ error: "Failed to fetch time slots" }); }
  });

  // ── OWNER ROUTES ──────────────────────────────────────────────────────────
  // Owner creates a new turf (starts as pending)
  // ── IMAGE UPLOAD ───────────────────────────────────────────────────────────
  app.post("/api/images/upload", async (req, res) => {
    try {
      const { data, mimeType } = req.body as { data: string; mimeType: string };
      if (!data || !mimeType) return res.status(400).json({ error: "data and mimeType required" });
      const id = await storage.storeImage(data, mimeType);
      res.json({ url: `/api/images/${id}` });
    } catch (e) {
      res.status(500).json({ error: "Image upload failed" });
    }
  });

  app.get("/api/images/:id", async (req, res) => {
    try {
      const img = await storage.getImage(req.params.id);
      if (!img) return res.status(404).json({ error: "Image not found" });
      const buf = Buffer.from(img.data, "base64");
      res.set("Content-Type", img.mimeType);
      res.set("Cache-Control", "public, max-age=31536000");
      res.send(buf);
    } catch (e) {
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  app.post("/api/owner/turfs", async (req, res) => {
    try {
      const data = insertTurfSchema.parse({ ...req.body, verified: false, approvalStatus: "pending" });
      const turf = await storage.createTurf(data);
      res.status(201).json(turf);
    } catch (e: any) {
      console.error("Create turf error:", e);
      if (e?.name === 'ZodError' && e.errors) {
        const fields = (e.errors as any[]).map((err: any) => `${err.path.join('.') || 'field'}: ${err.message}`).join('; ');
        res.status(400).json({ error: `Validation failed — ${fields}` });
      } else {
        res.status(400).json({ error: e?.message || "Invalid turf data" });
      }
    }
  });

  // Owner gets their own turfs
  app.get("/api/owner/turfs/:ownerId", async (req, res) => {
    try { res.json(await storage.getTurfsByOwner(req.params.ownerId)); }
    catch (e) { res.status(500).json({ error: "Failed to fetch owner turfs" }); }
  });

  // Owner gets bookings for a specific turf
  app.get("/api/owner/turfs/:turfId/bookings", async (req, res) => {
    try { res.json(await storage.getBookingsByTurf(req.params.turfId)); }
    catch (e) { res.status(500).json({ error: "Failed to fetch turf bookings" }); }
  });

  // ── ADMIN ROUTES ──────────────────────────────────────────────────────────
  // Admin gets all turfs
  app.get("/api/admin/turfs", async (req, res) => {
    try { res.json(await storage.getAllTurfs()); }
    catch (e) { res.status(500).json({ error: "Failed to fetch all turfs" }); }
  });

  // Admin gets pending turfs
  app.get("/api/admin/turfs/pending", async (req, res) => {
    try { res.json(await storage.getPendingTurfs()); }
    catch (e) { res.status(500).json({ error: "Failed to fetch pending turfs" }); }
  });

  // Admin approves turf
  app.patch("/api/admin/turfs/:id/approve", async (req, res) => {
    try {
      const turf = await storage.approveTurf(req.params.id);
      if (!turf) return res.status(404).json({ error: "Turf not found" });
      res.json(turf);
    } catch (e) { res.status(500).json({ error: "Failed to approve turf" }); }
  });

  // Admin rejects turf
  app.patch("/api/admin/turfs/:id/reject", async (req, res) => {
    try {
      const turf = await storage.rejectTurf(req.params.id);
      if (!turf) return res.status(404).json({ error: "Turf not found" });
      res.json(turf);
    } catch (e) { res.status(500).json({ error: "Failed to reject turf" }); }
  });

  // Admin gets pending owner accounts
  app.get("/api/admin/owners/pending", async (req, res) => {
    try { res.json(await storage.getPendingOwners()); }
    catch (e) { res.status(500).json({ error: "Failed to fetch pending owners" }); }
  });

  // Admin approves owner account
  app.patch("/api/admin/owners/:supabaseId/approve", async (req, res) => {
    try {
      const user = await storage.approveOwner(req.params.supabaseId);
      if (!user) return res.status(404).json({ error: "Owner not found" });
      res.json(user);
    } catch (e) { res.status(500).json({ error: "Failed to approve owner" }); }
  });

  // Admin rejects owner account
  app.patch("/api/admin/owners/:supabaseId/reject", async (req, res) => {
    try {
      const user = await storage.rejectOwner(req.params.supabaseId);
      if (!user) return res.status(404).json({ error: "Owner not found" });
      res.json(user);
    } catch (e) { res.status(500).json({ error: "Failed to reject owner" }); }
  });

  // Check owner status by supabaseId (owner polls this)
  app.get("/api/users/status/:supabaseId", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.supabaseId);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ ownerStatus: user.ownerStatus });
    } catch (e) { res.status(500).json({ error: "Failed to fetch status" }); }
  });

  // Admin gets all bookings
  app.get("/api/admin/bookings", async (req, res) => {
    try { res.json(await storage.getBookings()); }
    catch (e) { res.status(500).json({ error: "Failed to fetch bookings" }); }
  });

  // ── BOOKING ROUTES ────────────────────────────────────────────────────────
  // Returns bookings filtered by userId when provided, otherwise all bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const all = userId
        ? await storage.getBookingsByUser(userId)
        : await storage.getBookings();
      res.json(all);
    }
    catch (e) { res.status(500).json({ error: "Failed to fetch bookings" }); }
  });

  app.get("/api/bookings/verify/:code", async (req, res) => {
    try {
      const booking = await storage.getBookingByCode(req.params.code);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      res.json(booking);
    } catch (e) { res.status(500).json({ error: "Failed to verify booking" }); }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      res.json(booking);
    } catch (e) { res.status(500).json({ error: "Failed to fetch booking" }); }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (e: any) {
      console.error("Booking creation error:", e);
      if (e?.message?.includes('already booked')) {
        return res.status(409).json({ error: e.message });
      }
      res.status(400).json({ error: "Invalid booking data" });
    }
  });

  // ── USER PREFERENCES ─────────────────────────────────────────────────────
  app.get("/api/preferences/:userId", async (req, res) => {
    try {
      const prefs = await getPreferences(req.params.userId);
      res.json(prefs ?? { notifPrefs: {}, privacyPrefs: {} });
    } catch (e) { res.status(500).json({ error: "Failed to fetch preferences" }); }
  });

  app.put("/api/preferences/:userId", async (req, res) => {
    try {
      const { notifPrefs, privacyPrefs } = req.body as { notifPrefs?: Record<string, boolean>; privacyPrefs?: Record<string, boolean> };
      await savePreferences(req.params.userId, { notifPrefs, privacyPrefs });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to save preferences" });
    }
  });

  // ── PAYMENT METHODS ──────────────────────────────────────────────────────
  app.get("/api/payment-methods/:userId", async (req, res) => {
    try { res.json(await getPaymentMethods(req.params.userId)); }
    catch (e) { res.status(500).json({ error: "Failed to fetch payment methods" }); }
  });

  app.post("/api/payment-methods/:userId", async (req, res) => {
    try {
      const parsed = insertPaymentMethodSchema.parse({ ...req.body, userId: req.params.userId });
      const method = await addPaymentMethod(parsed);
      res.status(201).json(method);
    } catch (e: any) { res.status(400).json({ error: e?.message || "Failed to add payment method" }); }
  });

  app.delete("/api/payment-methods/:userId/:id", async (req, res) => {
    try {
      await removePaymentMethod(req.params.userId, req.params.id);
      res.json({ ok: true });
    } catch (e: any) { res.status(400).json({ error: e?.message || "Failed to remove" }); }
  });

  app.patch("/api/payment-methods/:userId/:id/default", async (req, res) => {
    try {
      await setDefaultPaymentMethod(req.params.userId, req.params.id);
      res.json({ ok: true });
    } catch (e: any) { res.status(400).json({ error: e?.message || "Failed to set default" }); }
  });

  // ── REVIEWS ───────────────────────────────────────────────────────────────
  app.get("/api/reviews/:userId", async (req, res) => {
    try { res.json(await getUserReview(req.params.userId)); }
    catch (e) { res.status(500).json({ error: "Failed to fetch review" }); }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const parsed = insertReviewSchema.parse(req.body);
      const review = await addReview(parsed);
      res.status(201).json(review);
    } catch (e: any) { res.status(400).json({ error: e?.message || "Failed to save review" }); }
  });

  // ── ADMIN: OWNER APPROVAL ROUTES ──────────────────────────────────────────
  // Uses Supabase Admin API (service_role key) to query auth users directly.
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get all pending owners
  app.get("/api/admin/owners/pending", async (_req, res) => {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;
      const pending = (data?.users || [])
        .filter((u: any) => u.user_metadata?.role === "owner" &&
          (!u.user_metadata?.ownerStatus || u.user_metadata.ownerStatus === "pending"))
        .map((u: any) => ({
          id: u.id,
          username: u.id,
          fullName: u.user_metadata?.full_name || u.email?.split("@")[0] || "Unknown",
          role: "owner",
          ownerStatus: u.user_metadata?.ownerStatus || "pending",
          email: u.email,
        }));
      res.json(pending);
    } catch (e: any) {
      console.error("Fetch pending owners error:", e?.message || e);
      res.status(500).json({ error: "Failed to fetch pending owners" });
    }
  });

  // Approve owner
  app.patch("/api/admin/owners/:id/approve", async (req, res) => {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
        user_metadata: { ownerStatus: "approved" },
      });
      if (error) throw error;
      res.json({ success: true, ownerStatus: "approved" });
    } catch (e: any) {
      console.error("Approve owner error:", e?.message || e);
      res.status(500).json({ error: "Failed to approve owner" });
    }
  });

  // Reject owner
  app.patch("/api/admin/owners/:id/reject", async (req, res) => {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
        user_metadata: { ownerStatus: "rejected" },
      });
      if (error) throw error;
      res.json({ success: true, ownerStatus: "rejected" });
    } catch (e: any) {
      console.error("Reject owner error:", e?.message || e);
      res.status(500).json({ error: "Failed to reject owner" });
    }
  });

  // ── ADMIN: TURF APPROVAL ROUTES ──────────────────────────────────────────
  // Get all pending turfs
  app.get("/api/admin/turfs/pending", async (_req, res) => {
    try {
      const turfs = await storage.getPendingTurfs();
      res.json(turfs);
    } catch (e) { res.status(500).json({ error: "Failed to fetch pending turfs" }); }
  });

  // Get all turfs (admin view)
  app.get("/api/admin/turfs", async (_req, res) => {
    try {
      res.json(await storage.getAllTurfs());
    } catch (e) { res.status(500).json({ error: "Failed to fetch turfs" }); }
  });

  // Approve turf
  app.patch("/api/admin/turfs/:id/approve", async (req, res) => {
    try {
      const turf = await storage.approveTurf(req.params.id);
      if (!turf) return res.status(404).json({ error: "Turf not found" });
      res.json(turf);
    } catch (e) { res.status(500).json({ error: "Failed to approve turf" }); }
  });

  // Reject turf
  app.patch("/api/admin/turfs/:id/reject", async (req, res) => {
    try {
      const turf = await storage.rejectTurf(req.params.id);
      if (!turf) return res.status(404).json({ error: "Turf not found" });
      res.json(turf);
    } catch (e) { res.status(500).json({ error: "Failed to reject turf" }); }
  });

  // ── USER STATUS CHECK (owner pending page) ───────────────────────────────
  app.get("/api/users/status/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ ownerStatus: user.ownerStatus, role: user.role });
    } catch (e) { res.status(500).json({ error: "Failed to fetch user status" }); }
  });

  // ── DB STATUS ─────────────────────────────────────────────────────────────
  app.get("/api/db-status", (_req, res) => {
    res.json({ connected: isDatabaseAvailable() });
  });

  // ── ADMIN CHECK ──────────────────────────────────────────────────────────
  // Checks the `admins` table to verify if a given email is an admin.
  app.get("/api/auth/is-admin/:email", async (req, res) => {
    try {
      const sql = getSql();
      const rows = await sql`SELECT email FROM admins WHERE email = ${decodeURIComponent(req.params.email)} LIMIT 1`;
      res.json({ isAdmin: rows.length > 0 });
    } catch (e: any) {
      console.error("Admin check error:", e?.message || e);
      res.json({ isAdmin: false });
    }
  });

  // ── GET ALL ADMINS (admin dashboard) ─────────────────────────────────────
  app.get("/api/admin/admins", async (_req, res) => {
    try {
      const sql = getSql();
      const rows = await sql`SELECT id, email, full_name, created_at FROM admins ORDER BY created_at`;
      res.json(rows);
    } catch (e: any) {
      console.error("Fetch admins error:", e?.message || e);
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  });

  return httpServer;
}