import express from "express"
import { 
	login, 
	refreshAccessToken, 
	logout, 
	logoutAll 
} from "../controllers/Admin/Login.js"
import { requireRole, verifyAccessToken } from "../middelwares/Admin/authMiddleware.js";
import { createAdmin, createEventCoordinator } from "../controllers/Admin/CreateAdminController.js";
import { getCurrentAdmin } from "../controllers/Admin/GetCurrentAdmin.js";
import { getAllAdmins, getAdminLoginStats, getStudentStats, getAllStudents, getStudentDetails, getStudentsByEvent } from "../controllers/Admin/AdminStats.js";
import { rateLimiters } from "../middelwares/securityMiddleware.js";
import { 
	validateLogin, 
	validateCreateAdmin, 
	validateCreateEventCoordinator,
	validateRefreshToken 
} from "../middelwares/validationMiddleware.js";


const Adminrouter = express.Router()

// ===== AUTHENTICATION ROUTES =====
// Login with both auth and brute force protection
Adminrouter.post("/login",
	// rateLimiters.bruteForce,
	validateLogin,
	login
);

// Token refresh with rate limiting
Adminrouter.post("/refresh-token", 
	// rateLimiters.refresh,
	validateRefreshToken,
	refreshAccessToken
);

// Logout routes
Adminrouter.post("/logout", 
	verifyAccessToken,
	logout
);

Adminrouter.post("/logout-all", 
	verifyAccessToken, 
	logoutAll
);

// ===== ADMIN INFO ROUTES =====
// Get current admin info
Adminrouter.get("/me", 
	verifyAccessToken, 
	getCurrentAdmin
);

// ===== ADMIN MANAGEMENT ROUTES (STRICT RATE LIMITING) =====
// Admin creation with admin creation limiter
Adminrouter.post("/create-admin", 
	rateLimiters.adminCreation,
	verifyAccessToken, 
	requireRole(["SuperAdmin"]), 
	validateCreateAdmin,
	createAdmin
);

// Event Coordinator creation route with admin creation limiter
Adminrouter.post("/create-coordinator",
	// rateLimiters.adminCreation,
	verifyAccessToken,
	requireRole(["SuperAdmin", "Aurum", "Yuva", "Olympus", "Verve"]),
	validateCreateEventCoordinator,
	createEventCoordinator
);

// ===== ADMIN STATISTICS ROUTES (MODERATE RATE LIMITING) =====
// Get all admins
Adminrouter.get("/all", 
	rateLimiters.api,
	verifyAccessToken, 
	requireRole(["SuperAdmin", "Admin"]), 
	getAllAdmins
);

// Admin login statistics
Adminrouter.get("/login-stats", 
	// rateLimiters.api,
	verifyAccessToken, 
	requireRole(["SuperAdmin", "Admin"]), 
	getAdminLoginStats
);

// Student statistics
Adminrouter.get("/student-stats",
	rateLimiters.api,
	verifyAccessToken,
	requireRole(["SuperAdmin", "Admin"]),
	getStudentStats
);

// ===== STUDENT MANAGEMENT ROUTES =====
// Get all students data with pagination and filtering
Adminrouter.get("/students",
	// rateLimiters.api,
	verifyAccessToken,
	requireRole(["SuperAdmin", "Admin"]),
	getAllStudents
);

// Get specific student details by ID or PRN
Adminrouter.get("/students/:id",
	// rateLimiters.api,
	verifyAccessToken,
	requireRole(["SuperAdmin", "Admin"]),
	getStudentDetails
);

// Get students by event registration
Adminrouter.get("/events/:eventId/students",
	// rateLimiters.api,
	verifyAccessToken,
	requireRole(["SuperAdmin", "Admin"]),
	getStudentsByEvent
);

export default Adminrouter