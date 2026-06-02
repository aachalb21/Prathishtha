import express from "express";
import multer from 'multer';
import { 
    createPhoto,
    getPhotos,
    getPhotoById,
    updatePhoto,
    deletePhoto,
    getPhotoStats,
    getPhotosByCategory,
    getCloudinaryFolderStructure,
    
    uploadPhoto
} from "../controllers/Photographer/PhotoController.js";
import { verifyAccessToken, requireRole } from "../middelwares/Admin/authMiddleware.js";
import { rateLimiters } from "../middelwares/securityMiddleware.js";

const photographerRouter = express.Router();

// ===== PUBLIC GALLERY ROUTES (No authentication required) =====

// Get public photo gallery (active photos only) with rate limiting
photographerRouter.get("/gallery", 
    rateLimiters.api,
    (req, res, next) => {
        // Set default filters for public gallery
        req.query.isActive = 'true';
        next();
    },
    getPhotos
);

// Get featured photos with rate limiting
photographerRouter.get("/gallery/featured", 
    rateLimiters.api,
    (req, res, next) => {
        // Set filters for featured photos
        req.query.isActive = 'true';
        req.query.isFeatured = 'true';
        req.query.limit = req.query.limit || '10';
        next();
    },
    getPhotos
);

// Get photos by category with rate limiting
photographerRouter.get("/gallery/category/:category", 
    rateLimiters.api,
    (req, res, next) => {
        // Set category filter
        req.query.isActive = 'true';
        req.query.eventCategory = req.params.category;
        next();
    },
    getPhotos
);

// Get photos by year with rate limiting
photographerRouter.get("/gallery/year/:year", 
    rateLimiters.api,
    (req, res, next) => {
        // Set year filter
        req.query.isActive = 'true';
        req.query.year = req.params.year;
        next();
    },
    getPhotos
);

// ===== PROTECTED ROUTES - Require authentication =====

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
    console.error('Multer error:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: "File too large. Maximum size is 10MB",
                code: "FILE_TOO_LARGE"
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: "Too many files. Only 1 file allowed",
                code: "TOO_MANY_FILES"
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                message: "Unexpected file field. Use 'photo' as field name",
                code: "UNEXPECTED_FILE"
            });
        }
    }
    
    if (err.message === 'Only image files are allowed') {
        return res.status(400).json({
            message: "Only image files are allowed",
            code: "INVALID_FILE_TYPE"
        });
    }
    
    return res.status(500).json({
        message: "File upload error",
        code: "UPLOAD_ERROR",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

// Upload new photo with metadata (strict rate limiting)
photographerRouter.post("/photos/upload", 
    verifyAccessToken,
    rateLimiters.upload,
    requireRole(["SuperAdmin", "Admin", "Photographer"]),
    (req, res, next) => {
        uploadPhoto.single('photo')(req, res, (err) => {
            if (err) {
                return handleMulterError(err, req, res, next);
            }
            next();
        });
    },
    createPhoto
);

// Get all photos with filtering and pagination (moderate rate limiting)
photographerRouter.get("/photos", 
    verifyAccessToken,
    rateLimiters.api,
    requireRole(["SuperAdmin", "Admin", "Photographer"]),
    getPhotos
);

// Get photo statistics (moderate rate limiting)
photographerRouter.get("/photos/stats", 
    verifyAccessToken,
    rateLimiters.api,
    requireRole(["SuperAdmin", "Admin", "Photographer"]),
    getPhotoStats
);

// Get photos organized by category (moderate rate limiting)
photographerRouter.get("/photos/by-category", 
    verifyAccessToken,
    rateLimiters.api,
    requireRole(["SuperAdmin", "Admin", "Photographer"]),
    getPhotosByCategory
);

// Get Cloudinary folder structure (moderate rate limiting)
photographerRouter.get("/folders/structure", 
    verifyAccessToken,
    rateLimiters.api,
    requireRole(["SuperAdmin", "Admin", "Photographer"]),
    getCloudinaryFolderStructure
);

// Get single photo by ID (moderate rate limiting)
photographerRouter.get("/photos/:id", 
    verifyAccessToken,
    rateLimiters.api,
    requireRole(["SuperAdmin", "Admin", "Photographer"]),
    getPhotoById
);

// Update photo metadata (moderate rate limiting)
photographerRouter.put("/photos/:id", 
    verifyAccessToken,
    rateLimiters.update,
    requireRole(["SuperAdmin", "Admin", "Photographer"]),
    updatePhoto
);

// Delete photo with strict rate limiting
photographerRouter.delete("/photos/:id", 
    verifyAccessToken,
    rateLimiters.delete,
    requireRole(["SuperAdmin", "Admin", "Photographer"]),
    deletePhoto
);




export default photographerRouter;