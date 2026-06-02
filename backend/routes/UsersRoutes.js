import express from 'express';
import { signup } from '../controllers/Users/Signup.js';
import { checkAuth } from '../controllers/Users/auth.js';
import { loginUser, refreshToken, logoutUser, checkAuth as checkAuthStatus } from '../controllers/Users/Login.js';
import { verifyEmail, resendOTP, checkVerificationStatus, updateEmail } from '../controllers/Users/Verification.js';
import { submitContactForm } from '../controllers/Users/contactUs.js';
import { 
  getUserQRCode, 
  downloadUserQRCode, 
  regenerateQRCode, 
} from '../controllers/Users/QRController.js';
import { 
  forgotPassword, 
  resetPassword, 
  verifyResetToken 
} from '../controllers/Users/PasswordReset.js';
import { 
  buildLeaderboard, 
  getCompleteLeaderboard,
  forceRebuildLeaderboard,
  cleanLeaderboard
} from '../controllers/Users/LeaderBoardController.js';
import {
  verifyUserAttendance,
  markAttendance,
  getUserEventHistory
} from '../controllers/Users/AttendanceController.js';
import {
  getRegisteredEvents,
  getRegisteredEventById
} from '../controllers/Users/RegisteredEventsController.js';
import { verifyAccessToken, requireRole } from '../middelwares/Admin/authMiddleware.js';
import { rateLimiters, createRateLimiter } from '../middelwares/securityMiddleware.js';

// Create custom rate limiters for specific user endpoints
const contactFormLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 contact form submissions per hour
  'Too many contact form submissions. Please try again in 1 hour.',
  false
);

const otpLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 OTP requests per window
  'Too many OTP requests. Please try again in 15 minutes.',
  false
);

const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 password reset attempts per hour
  'Too many password reset attempts. Please try again in 1 hour.',
  false
);

const qrRegenerateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 QR code regenerations per hour
  'Too many QR code regeneration attempts. Please try again in 1 hour.',
  false
);

const Userrouter = express.Router()

// ===== AUTHENTICATION ROUTES (STRICT RATE LIMITING) =====
// User login with auth and brute force protection
Userrouter.post("/auth/login", 
  // rateLimiters.auth,
  // rateLimiters.bruteForce,
  loginUser
);

// Token refresh with rate limiting
Userrouter.post("/auth/refresh-token", 
  // rateLimiters.refresh,
  refreshToken
);

// Logout route
Userrouter.post("/auth/logout", logoutUser);

// User signup with auth limiter
Userrouter.post("/auth/signup", 
  // rateLimiters.auth,
  signup
);

// Check auth status
Userrouter.get("/auth/check", checkAuth, checkAuthStatus);
Userrouter.get("/me", checkAuth, checkAuthStatus);

// ===== EMAIL VERIFICATION ROUTES =====
// Verify email with OTP limiter
Userrouter.post("/auth/verify-email", 
  // otpLimiter,
  verifyEmail
);

// Resend OTP with strict rate limiting
Userrouter.post("/auth/resend-otp", 
  // otpLimiter,
  resendOTP
);

// Update email for unverified users (allows correcting wrong email during verification)
Userrouter.post("/auth/update-email", 
  // otpLimiter,
  updateEmail
);

// Check verification status
Userrouter.get("/auth/verification-status", 
  // rateLimiters.api,
  checkVerificationStatus
);

// ===== PASSWORD RESET ROUTES =====
// Forgot password with rate limiting
Userrouter.post("/auth/forgot-password", 
  // passwordResetLimiter,
  forgotPassword
);

// Reset password with rate limiting
Userrouter.post("/auth/reset-password", 
  // passwordResetLimiter,
  resetPassword
);

// Verify reset token with rate limiting
Userrouter.get("/auth/verify-reset-token/:token", 
  // rateLimiters.api,
  verifyResetToken
);

// ===== CONTACT ROUTES =====
// Submit contact form with strict rate limiting
Userrouter.post("/contact", 
  contactFormLimiter,
  submitContactForm
);

// ===== QR CODE ROUTES =====
// Get user's QR code
Userrouter.get("/qr-code/:userId", 
  rateLimiters.api,
  getUserQRCode
);

// Download QR code as image
Userrouter.get("/qr-code/:userId/download", 
  rateLimiters.api,
  downloadUserQRCode
);

// Regenerate QR code (authenticated with strict rate limiting)
Userrouter.post("/qr-code/:userId/regenerate", 
  checkAuth, 
  qrRegenerateLimiter,
  regenerateQRCode
);

// ===== LEADERBOARD ROUTES =====
// Build/rebuild leaderboard (admin operation with rate limiting)
Userrouter.post("/leaderboard/build", 
  rateLimiters.api,
  buildLeaderboard
);

// Force rebuild leaderboard - cleans and rebuilds from scratch
Userrouter.post("/leaderboard/rebuild-force",
  rateLimiters.api,
  forceRebuildLeaderboard
);

// Clean leaderboard - remove old fields and recreate with exp only
Userrouter.post("/leaderboard/clean",
  rateLimiters.api,
  cleanLeaderboard
);

// Get complete leaderboard with pagination
Userrouter.get("/leaderboard", 
  rateLimiters.api,
  getCompleteLeaderboard
);

// ===== ATTENDANCE ROUTES =====
// Verify user registration for event (admin protected)
Userrouter.post("/verify-attendance", 
  // rateLimiters.api,
  verifyAccessToken, 
  requireRole(["SuperAdmin", "Admin", "EventCoordinator", "Yuva", "Olympus", "Aurum", "Verve"]),
  verifyUserAttendance
);

// Mark attendance for user (admin protected)
Userrouter.post("/mark-attendance", 
  // rateLimiters.api,
  verifyAccessToken, 
  requireRole(["SuperAdmin", "Admin", "EventCoordinator", "Yuva", "Olympus", "Aurum", "Verve"]),
  markAttendance
);

// Get user's event history (admin protected)
Userrouter.get("/:userId/event-history", 
  // rateLimiters.api,
  verifyAccessToken, 
  requireRole(["SuperAdmin", "Admin", "EventCoordinator", "Yuva", "Olympus", "Aurum", "Verve"]),
  getUserEventHistory
);

// ===== REGISTERED EVENTS ROUTES =====
// Get all registered events for logged-in user
Userrouter.get("/registered-events", 
  // rateLimiters.api,
  checkAuth,
  getRegisteredEvents
);

// Get specific registered event details
Userrouter.get("/registered-events/:eventId", 
  // rateLimiters.api,
  checkAuth,
  getRegisteredEventById
);

export default Userrouter;