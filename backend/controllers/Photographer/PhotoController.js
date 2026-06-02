import Photo from "../../models/Photographer/Photo.js";
import CloudStorageService from "../../utils/cloudStorage.js";
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary storage for gallery photos organized by year
const photoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Get year from request body, default to current year
    const year = req.body.year || new Date().getFullYear();
    
    // Generate public_id
    const timestamp = Date.now();
    const originalName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const eventName = req.body.eventName ? req.body.eventName.replace(/[^a-zA-Z0-9]/g, '_') : 'event';
    const publicId = `${eventName}_${originalName}_${timestamp}`;
    
    console.log('=== PHOTO UPLOAD DEBUG ===');
    console.log('Year from req.body:', req.body.year);
    console.log('Final year used:', year);
    console.log('Event name:', req.body.eventName);
    console.log('Generated folder:', `pratishtha/photographer/gallery/${year}`);
    console.log('Generated public_id:', publicId);
    console.log('=== END DEBUG ===');
    
    return {
      folder: `pratishtha/photographer/gallery/${year}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: publicId,
      transformation: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };
  }
});

// Multer configuration for photo uploads
export const uploadPhoto = multer({
  storage: photoStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter - checking file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  onError: (err, next) => {
    console.error('Multer error:', err);
    next(err);
  }
});

/**
 * Upload a single photo with metadata
 */
export const createPhoto = async (req, res) => {
  try {
    // Validate Cloudinary configuration
    if (!CloudStorageService.validateConfiguration()) {
      return res.status(500).json({
        message: "Cloud storage service not configured properly",
        code: "STORAGE_CONFIG_ERROR"
      });
    }

    const { name, year, eventName, eventCategory, description, tags } = req.body;
    const adminId = req.admin.id; // From auth middleware

    // Validate required fields
    if (!name || !year || !eventName || !eventCategory || !description) {
      return res.status(400).json({
        message: "All fields are required: name, year, eventName, eventCategory, description",
        code: "MISSING_REQUIRED_FIELDS"
      });
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear + 1) {
      return res.status(400).json({
        message: `Year must be between 2020 and ${currentYear + 1}`,
        code: "INVALID_YEAR"
      });
    }

    // Validate event category
    const validCategories = ["Aurum", "Yuva", "Olympus", "Verve", "Others"];
    if (!validCategories.includes(eventCategory)) {
      return res.status(400).json({
        message: "Invalid event category. Must be one of: " + validCategories.join(", "),
        code: "INVALID_CATEGORY"
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "Photo file is required",
        code: "MISSING_FILE"
      });
    }

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
        if (!Array.isArray(parsedTags)) {
          parsedTags = [tags];
        }
      } catch (error) {
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }

    // Get file information from Cloudinary upload
    const file = req.file;
    console.log('File uploaded to gallery folder:', {
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      year: year,
      category: eventCategory,
      folder: `pratishtha/photographer/gallery/${year}`
    });
    
    // Generate thumbnail URL
    const thumbnailUrl = CloudStorageService.generateThumbnailUrl(file.filename);

    // Create photo document
    const photoData = {
      name: name.trim(),
      year: parseInt(year),
      eventName: eventName.trim(),
      eventCategory,
      description: description.trim(),
      imageUrl: file.path,
      publicId: file.filename,
      thumbnailUrl,
      width: file.width || null,
      height: file.height || null,
      format: file.format || null,
      bytes: file.size || null,
      uploadedBy: adminId,
      tags: parsedTags,
    };

    console.log('Photo data to save:', photoData);

    const photo = new Photo(photoData);
    await photo.save();

    // Populate uploadedBy field for response
    await photo.populate('uploadedBy', 'name email');

    res.status(201).json({
      message: "Photo uploaded successfully",
      photo: {
        ...photo.toObject(),
        responsiveUrls: photo.responsiveUrls
      }
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    console.error('Error stack:', error.stack);
    
    // If photo was uploaded to Cloudinary but database save failed, clean up
    if (req.file && req.file.filename) {
      try {
        await CloudStorageService.deleteImage(req.file.filename);
        console.log('Cleaned up uploaded image:', req.file.filename);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded image:', cleanupError);
      }
    }

    // Handle specific errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors,
        code: "VALIDATION_ERROR"
      });
    }

    if (error.message.includes('Only image files are allowed')) {
      return res.status(400).json({
        message: "Only image files are allowed",
        code: "INVALID_FILE_TYPE"
      });
    }

    if (error.message.includes('File too large')) {
      return res.status(400).json({
        message: "File size too large. Maximum size is 10MB",
        code: "FILE_TOO_LARGE"
      });
    }

    // Check for Cloudinary errors
    if (error.message.includes('cloudinary') || error.message.includes('upload')) {
      return res.status(500).json({
        message: "File upload failed. Please check your connection and try again.",
        code: "UPLOAD_ERROR",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Database connection errors
    if (error.message.includes('connection') || error.name === 'MongoError') {
      return res.status(500).json({
        message: "Database connection error. Please try again.",
        code: "DATABASE_ERROR"
      });
    }

    res.status(500).json({
      message: "Internal server error",
      code: "INTERNAL_ERROR",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all photos with filtering and pagination
 */
export const getPhotos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      eventCategory,
      year,
      eventName,
      isActive = true,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (eventCategory && eventCategory !== 'all') {
      filter.eventCategory = eventCategory;
    }
    
    if (year) {
      filter.year = parseInt(year);
    }
    
    if (eventName) {
      filter.eventName = new RegExp(eventName, 'i');
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true';
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { eventName: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const photos = await Photo.find(filter)
      .populate('uploadedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalPhotos = await Photo.countDocuments(filter);
    const totalPages = Math.ceil(totalPhotos / parseInt(limit));

    // Add responsive URLs to each photo
    const photosWithUrls = photos.map(photo => ({
      ...photo,
      responsiveUrls: {
        thumbnail: CloudStorageService.generateOptimizedUrl(photo.publicId, 'thumbnail'),
        medium: CloudStorageService.generateOptimizedUrl(photo.publicId, 'medium'),
        large: CloudStorageService.generateOptimizedUrl(photo.publicId, 'large'),
        original: photo.imageUrl
      }
    }));

    res.status(200).json({
      message: "Photos retrieved successfully",
      photos: photosWithUrls,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPhotos,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
      filters: {
        eventCategory,
        year,
        eventName,
        isActive,
        isFeatured,
        search
      }
    });

  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * Get a single photo by ID
 */
export const getPhotoById = async (req, res) => {
  try {
    const { id } = req.params;

    const photo = await Photo.findById(id)
      .populate('uploadedBy', 'name email')
      .lean();

    if (!photo) {
      return res.status(404).json({
        message: "Photo not found",
        code: "PHOTO_NOT_FOUND"
      });
    }

    // Add responsive URLs
    const photoWithUrls = {
      ...photo,
      responsiveUrls: {
        thumbnail: CloudStorageService.generateOptimizedUrl(photo.publicId, 'thumbnail'),
        medium: CloudStorageService.generateOptimizedUrl(photo.publicId, 'medium'),
        large: CloudStorageService.generateOptimizedUrl(photo.publicId, 'large'),
        original: photo.imageUrl
      }
    };

    res.status(200).json({
      message: "Photo retrieved successfully",
      photo: photoWithUrls
    });

  } catch (error) {
    console.error('Get photo by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid photo ID",
        code: "INVALID_ID"
      });
    }

    res.status(500).json({
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * Update photo metadata (not the image itself)
 */
export const updatePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, year, eventName, eventCategory, description, tags, isActive, isFeatured } = req.body;
    const adminId = req.admin.id;

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({
        message: "Photo not found",
        code: "PHOTO_NOT_FOUND"
      });
    }

    // Update fields if provided
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (year < 2020 || year > currentYear + 1) {
        return res.status(400).json({
          message: `Year must be between 2020 and ${currentYear + 1}`,
          code: "INVALID_YEAR"
        });
      }
      updates.year = parseInt(year);
    }
    if (eventName !== undefined) updates.eventName = eventName.trim();
    if (eventCategory !== undefined) {
      const validCategories = ["Aurum", "Yuva", "Olympus", "Verve", "Others"];
      if (!validCategories.includes(eventCategory)) {
        return res.status(400).json({
          message: "Invalid event category. Must be one of: " + validCategories.join(", "),
          code: "INVALID_CATEGORY"
        });
      }
      updates.eventCategory = eventCategory;
    }
    if (description !== undefined) updates.description = description.trim();
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (isFeatured !== undefined) updates.isFeatured = Boolean(isFeatured);
    
    if (tags !== undefined) {
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = JSON.parse(tags);
          if (!Array.isArray(parsedTags)) {
            parsedTags = [tags];
          }
        } catch (error) {
          parsedTags = tags.split(',').map(tag => tag.trim());
        }
      }
      updates.tags = parsedTags;
    }

    updates.updatedAt = Date.now();

    const updatedPhoto = await Photo.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');

    res.status(200).json({
      message: "Photo updated successfully",
      photo: {
        ...updatedPhoto.toObject(),
        responsiveUrls: updatedPhoto.responsiveUrls
      }
    });

  } catch (error) {
    console.error('Update photo error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid photo ID",
        code: "INVALID_ID"
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors,
        code: "VALIDATION_ERROR"
      });
    }

    res.status(500).json({
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * Delete a photo (permanent delete from both database and Cloudinary by default)
 */
export const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { soft } = req.query; // ?soft=true for soft delete (deactivate only)

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({
        message: "Photo not found",
        code: "PHOTO_NOT_FOUND"
      });
    }

    // Check if user has permission to delete this photo
    if (photo.uploadedBy.toString() !== req.admin.id && !['Photographer', 'SuperAdmin'].includes(req.admin.role)) {
      return res.status(403).json({
        message: "You don't have permission to delete this photo",
        code: "PERMISSION_DENIED"
      });
    }

    if (soft === 'true') {
      // Soft delete - set isActive to false (only deactivate)
      photo.isActive = false;
      photo.updatedAt = Date.now();
      await photo.save();
      
      res.status(200).json({
        message: "Photo deactivated successfully",
        code: "PHOTO_DEACTIVATED"
      });
    } else {
      // Hard delete (default) - remove from both Cloudinary and database
      let cloudinaryDeleted = false;
      let cloudinaryError = null;

      // First, try to delete from Cloudinary
      try {
        if (photo.publicId) {
          console.log(`Attempting to delete image from Cloudinary: ${photo.publicId}`);
          const cloudinaryResult = await CloudStorageService.deleteImage(photo.publicId);
          cloudinaryDeleted = true;
          console.log('Cloudinary deletion result:', cloudinaryResult);
        }
      } catch (cloudError) {
        console.error('Failed to delete image from Cloudinary:', cloudError);
        cloudinaryError = cloudError.message;
        // Don't return here - we'll still delete from database
      }

      // Delete from database regardless of Cloudinary result
      await Photo.findByIdAndDelete(id);
      
      const response = {
        message: "Photo permanently deleted from database",
        code: "PHOTO_DELETED",
        databaseDeleted: true,
        cloudinaryDeleted: cloudinaryDeleted
      };

      if (cloudinaryError) {
        response.warning = `Photo deleted from database but failed to delete from Cloudinary: ${cloudinaryError}`;
        response.cloudinaryError = cloudinaryError;
      } else {
        response.message = "Photo permanently deleted from both database and cloud storage";
      }
      
      res.status(200).json(response);
    }

  } catch (error) {
    console.error('Delete photo error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid photo ID",
        code: "INVALID_ID"
      });
    }

    res.status(500).json({
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};





/**
 * Get photos organized by category and year
 */
export const getPhotosByCategory = async (req, res) => {
  try {
    const categories = ['Aurum', 'Yuva', 'Olympus', 'Verve', 'Others'];
    const organizedPhotos = {};

    for (const category of categories) {
      // Get photos for this category
      const photos = await Photo.find({ 
        eventCategory: category, 
        isActive: true 
      })
      .populate('uploadedBy', 'name email')
      .sort({ year: -1, createdAt: -1 })
      .lean();

      // Group by year
      const photosByYear = photos.reduce((acc, photo) => {
        const year = photo.year;
        if (!acc[year]) {
          acc[year] = [];
        }
        acc[year].push({
          ...photo,
          responsiveUrls: {
            thumbnail: CloudStorageService.generateOptimizedUrl(photo.publicId, 'thumbnail'),
            medium: CloudStorageService.generateOptimizedUrl(photo.publicId, 'medium'),
            large: CloudStorageService.generateOptimizedUrl(photo.publicId, 'large'),
            original: photo.imageUrl
          }
        });
        return acc;
      }, {});

      organizedPhotos[category] = {
        totalPhotos: photos.length,
        photosByYear
      };
    }

    res.status(200).json({
      message: "Photos organized by category retrieved successfully",
      organizedPhotos
    });

  } catch (error) {
    console.error('Get photos by category error:', error);
    res.status(500).json({
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * Get photo statistics
 */
export const getPhotoStats = async (req, res) => {
  try {
    // Get overview stats
    const totalPhotos = await Photo.countDocuments();
    const activePhotos = await Photo.countDocuments({ isActive: true });
    const featuredPhotos = await Photo.countDocuments({ isFeatured: true });
    
    // Calculate total size
    const photos = await Photo.find({}, 'size');
    const totalSize = photos.reduce((sum, photo) => sum + (photo.size || 0), 0);
    
    // Get stats by category
    const categoryStats = await Photo.aggregate([
      {
        $group: {
          _id: '$eventCategory',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          featuredCount: {
            $sum: { $cond: ['$isFeatured', 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get stats by year
    const yearStats = await Photo.aggregate([
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    res.status(200).json({
      message: "Photo statistics retrieved successfully",
      stats: {
        overview: {
          totalPhotos,
          activePhotos,
          inactivePhotos: totalPhotos - activePhotos,
          featuredPhotos,
          totalSize
        },
        byCategory: categoryStats,
        byYear: yearStats
      }
    });

  } catch (error) {
    console.error('Get photo stats error:', error);
    res.status(500).json({
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * Get Cloudinary folder structure
 */
export const getCloudinaryFolderStructure = async (req, res) => {
  try {
    const structure = await CloudStorageService.getPhotographerFolderStructure();
    
    res.status(200).json({
      message: "Cloudinary folder structure retrieved successfully",
      structure
    });

  } catch (error) {
    console.error('Get folder structure error:', error);
    res.status(500).json({
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

