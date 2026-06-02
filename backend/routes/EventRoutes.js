import express from "express";
import multer from "multer";

import {
  uploadEventPoster,
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  toggleRegistrationStatus,
  verifyEventCode,
} from "../controllers/Events/EventController.js";
import {
  getAllPublicEvents,
  getPublicEventsByCategory,
  getPublicEventBySlug,
  eventRegistration,
  registerForEvent,
  joinTeam,
  getTeamDetails,
} from "../controllers/Events/PublicEventController.js";
import { checkAuth } from "../controllers/Users/auth.js";
import {
  requireRole,
  verifyAccessToken,
} from "../middelwares/Admin/authMiddleware.js";
import { rateLimiters } from "../middelwares/securityMiddleware.js";

const eventRouter = express.Router();

// ===== PUBLIC ROUTES (No Authentication Required) =====

// Get All Public Events
eventRouter.get("/public", rateLimiters.api, getAllPublicEvents);

// Get Public Events by Category
eventRouter.get(
  "/public/category/:category",
  rateLimiters.api,
  getPublicEventsByCategory
);

// Get Single Public Event by Slug
eventRouter.get("/public/slug/:slug", rateLimiters.api, getPublicEventBySlug);

// Public registration info (GET) and registration (POST)
// GET returns registration availability/info (public)
eventRouter.get("/public/register/:slug", rateLimiters.api, eventRegistration);
// POST performs registration and requires authentication
eventRouter.post("/public/register/:slug", rateLimiters.api, checkAuth, registerForEvent);

// Join a team using token (authenticated)
eventRouter.post("/public/join/:token", rateLimiters.api, checkAuth, joinTeam);

// Get team details and join link (authenticated - leader or members only)
eventRouter.get("/public/team/:teamId", rateLimiters.api, checkAuth, getTeamDetails);

// ===== ADMIN ROUTES (Authentication Required) =====

// Multer setup for event poster uploads
const handleMulterError = (err, req, res, next) => {
  console.error("Multer error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Maximum size is 5MB",
        code: "FILE_TOO_LARGE",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files. Only 1 file allowed",
        code: "TOO_MANY_FILES",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Unexpected file field. Use 'event_poster' as field name",
        code: "UNEXPECTED_FILE",
      });
    }
  }

  if (err.message === "Only image files are allowed!") {
    return res.status(400).json({
      message: "Only image files are allowed",
      code: "INVALID_FILE_TYPE",
    });
  }

  return res.status(500).json({
    message: "File upload error",
    code: "UPLOAD_ERROR",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

// Create Event Route
eventRouter.post(
  "/create",
  verifyAccessToken,
  // rateLimiters.upload,
  requireRole(["SuperAdmin", "Admin", "Aurum", "Olympus", "Yuva", "Verve"]),
  (req, res, next) => {
    uploadEventPoster.single("event_poster")(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  createEvent
);

// Get All Events Route (moderate rate limiting)
eventRouter.get(
  "/",
  verifyAccessToken,
  rateLimiters.api,
  requireRole(["SuperAdmin", "Admin", "Aurum", "Olympus", "Yuva", "Verve"]),
  getAllEvents
);

// Get Single Event Route (moderate rate limiting)
eventRouter.get(
  "/:id",
  verifyAccessToken,
  rateLimiters.api,
  requireRole(["SuperAdmin", "Admin", "Aurum", "Olympus", "Yuva", "Verve"]),
  getEventById
);

// Update Event Route
eventRouter.put(
  "/:id",
  verifyAccessToken,
  rateLimiters.upload,
  requireRole(["SuperAdmin", "Admin", "Aurum", "Olympus", "Yuva", "Verve"]),
  (req, res, next) => {
    uploadEventPoster.single("event_poster")(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  updateEvent
);

// Delete Event Route (strict rate limiting)
eventRouter.delete(
  "/:id",
  verifyAccessToken,
  rateLimiters.delete,
  requireRole(["SuperAdmin", "Admin", "Aurum", "Olympus", "Yuva", "Verve"]),
  deleteEvent
);

// Toggle Registration Status Route (moderate rate limiting)
eventRouter.patch(
  "/:id/toggle-registration",
  verifyAccessToken,
  rateLimiters.api,
  requireRole(["SuperAdmin", "Admin", "Aurum", "Olympus", "Yuva", "Verve"]),
  toggleRegistrationStatus
);

// Verify Event Code for Event Coordinator Access (moderate rate limiting)
eventRouter.get(
  "/verify-code/:eventCode",
  verifyAccessToken,
  // rateLimiters.api,
  requireRole(["SuperAdmin", "Admin", "EventCoordinator", "Yuva", "Olympus", "Aurum", "Verve"]),
  verifyEventCode
);

export default eventRouter;
