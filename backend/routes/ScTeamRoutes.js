import express from "express";
import {
  addCouncilMember,
  getAllCouncilMembers,
  getCouncilMembersGrouped,
  getCouncilMemberById,
  updateCouncilMember,
  deleteCouncilMember,
  uploadScTeamPhoto,
} from "../controllers/Admin/ScTeamController.js";
import { verifyAdminToken } from "../middelwares/Admin/authMiddleware.js";
import { rateLimiters } from "../middelwares/securityMiddleware.js";

const router = express.Router();

// ===== PUBLIC ROUTES (for frontend to fetch team data) =====
// Get all council members
router.get("/", 
  rateLimiters.api,
  getAllCouncilMembers
);

// Get council members grouped
router.get("/grouped", 
  rateLimiters.api,
  getCouncilMembersGrouped
);

// Get specific council member by ID
router.get("/:id", 
  rateLimiters.api,
  getCouncilMemberById
);

// ===== PROTECTED ROUTES (require admin authentication) =====
// Add new council member (upload with strict rate limiting)
router.post("/", 
  rateLimiters.upload,
  verifyAdminToken, 
  uploadScTeamPhoto.single("profileImage"), 
  addCouncilMember
);

// Update council member (moderate rate limiting)
router.put("/:id", 
  rateLimiters.update,
  verifyAdminToken, 
  uploadScTeamPhoto.single("profileImage"), 
  updateCouncilMember
);

// Delete council member (strict rate limiting)
router.delete("/:id", 
  rateLimiters.delete,
  verifyAdminToken, 
  deleteCouncilMember
);

export default router;
