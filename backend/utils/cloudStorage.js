import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Configure Cloudinary storage for different asset types
const createCloudinaryStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'webp']) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `pratishtha/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      public_id: (req, file) => {
        const timestamp = Date.now();
        const originalName = file.originalname.split('.')[0];
        return `${originalName}_${timestamp}`;
      }
    }
  });
};

// Storage configurations for different asset types
export const eventBannerStorage = createCloudinaryStorage('events/banners');
export const eventGalleryStorage = createCloudinaryStorage('events/gallery');
export const eventDocumentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pratishtha/events/documents',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
    resource_type: 'auto'
  }
});

// Create category-based storage for photographer photos
export const createPhotographerStorage = (category, year) => {
  const folderPath = `pratishtha/photographer/${category.toLowerCase()}/${year}`;
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folderPath,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      public_id: (req, file) => {
        const timestamp = Date.now();
        const originalName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
        const eventName = req.body.eventName ? req.body.eventName.replace(/[^a-zA-Z0-9]/g, '_') : 'event';
        return `${eventName}_${originalName}_${timestamp}`;
      }
    }
  });
};

// Multer configurations for different upload types
export const uploadEventBanner = multer({
  storage: eventBannerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for banners'), false);
    }
  }
});

export const uploadEventGallery = multer({
  storage: eventGalleryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for gallery'), false);
    }
  }
});

export const uploadEventDocument = multer({
  storage: eventDocumentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'), false);
    }
  }
});

// Cloud storage utility functions
export class CloudStorageService {
  
  /**
   * Upload a single image to Cloudinary
   * @param {string} filePath - Local file path or buffer
   * @param {object} options - Upload options
   * @returns {Promise<object>} - Upload result with URL and public_id
   */
  static async uploadImage(filePath, options = {}) {
    try {
      const defaultOptions = {
        folder: 'pratishtha/events',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        ...options
      };

      const result = await cloudinary.uploader.upload(filePath, defaultOptions);
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        thumbnailUrl: this.generateThumbnailUrl(result.public_id)
      };
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw new Error('Failed to upload image to cloud storage');
    }
  }

  /**
   * Upload multiple images to Cloudinary
   * @param {Array<string>} filePaths - Array of file paths
   * @param {object} options - Upload options
   * @returns {Promise<Array<object>>} - Array of upload results
   */
  static async uploadMultipleImages(filePaths, options = {}) {
    try {
      const uploadPromises = filePaths.map(filePath => 
        this.uploadImage(filePath, options)
      );
      
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw new Error('Failed to upload images to cloud storage');
    }
  }

  /**
   * Delete an image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<object>} - Deletion result
   */
  static async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw new Error('Failed to delete image from cloud storage');
    }
  }

  /**
   * Delete multiple images from Cloudinary
   * @param {Array<string>} publicIds - Array of Cloudinary public IDs
   * @returns {Promise<object>} - Deletion result
   */
  static async deleteMultipleImages(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      throw new Error('Failed to delete images from cloud storage');
    }
  }

  /**
   * Generate thumbnail URL from public ID
   * @param {string} publicId - Cloudinary public ID
   * @param {object} options - Transformation options
   * @returns {string} - Thumbnail URL
   */
  static generateThumbnailUrl(publicId, options = {}) {
    const defaultOptions = {
      width: 400,
      height: 300,
      crop: 'fill',
      quality: 'auto:low',
      fetch_format: 'auto'
    };

    const transformOptions = { ...defaultOptions, ...options };
    
    return cloudinary.url(publicId, transformOptions);
  }

  /**
   * Generate optimized URL for different screen sizes
   * @param {string} publicId - Cloudinary public ID
   * @param {string} size - Size preset (thumbnail, medium, large, original)
   * @returns {string} - Optimized URL
   */
  static generateOptimizedUrl(publicId, size = 'medium') {
    const sizePresets = {
      thumbnail: { width: 400, height: 300, crop: 'fill', quality: 'auto:low' },
      medium: { width: 800, height: 600, crop: 'limit', quality: 'auto:good' },
      large: { width: 1200, height: 900, crop: 'limit', quality: 'auto:good' },
      original: { quality: 'auto:best', fetch_format: 'auto' }
    };

    const preset = sizePresets[size] || sizePresets.medium;
    return cloudinary.url(publicId, preset);
  }

  /**
   * Get image metadata from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<object>} - Image metadata
   */
  static async getImageMetadata(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
        tags: result.tags
      };
    } catch (error) {
      console.error('Error getting image metadata:', error);
      throw new Error('Failed to get image metadata');
    }
  }

  /**
   * Search images in Cloudinary
   * @param {object} searchOptions - Search parameters
   * @returns {Promise<Array<object>>} - Search results
   */
  static async searchImages(searchOptions = {}) {
    try {
      const defaultOptions = {
        resource_type: 'image',
        max_results: 50,
        ...searchOptions
      };

      const result = await cloudinary.search
        .expression(defaultOptions.expression || 'folder:pratishtha/events')
        .max_results(defaultOptions.max_results)
        .execute();

      return result.resources.map(resource => ({
        publicId: resource.public_id,
        url: resource.secure_url,
        thumbnailUrl: this.generateThumbnailUrl(resource.public_id),
        width: resource.width,
        height: resource.height,
        format: resource.format,
        bytes: resource.bytes,
        createdAt: resource.created_at
      }));
    } catch (error) {
      console.error('Error searching images:', error);
      throw new Error('Failed to search images');
    }
  }

  /**
   * Generate CDN URLs for responsive images
   * @param {string} publicId - Cloudinary public ID
   * @returns {object} - Object with different sized URLs
   */
  static generateResponsiveUrls(publicId) {
    return {
      thumbnail: this.generateOptimizedUrl(publicId, 'thumbnail'),
      medium: this.generateOptimizedUrl(publicId, 'medium'),
      large: this.generateOptimizedUrl(publicId, 'large'),
      original: this.generateOptimizedUrl(publicId, 'original')
    };
  }

  /**
   * Upload photo to category-specific folder
   * @param {string} filePath - Local file path or buffer
   * @param {string} category - Event category (Aurum, Yuva, Olympus, Verve, Others)
   * @param {number} year - Year of the event
   * @param {string} eventName - Name of the event
   * @param {object} options - Additional upload options
   * @returns {Promise<object>} - Upload result with URL and public_id
   */
  static async uploadPhotoByCategory(filePath, category, year, eventName, options = {}) {
    try {
      const folderPath = `pratishtha/photographer/${category.toLowerCase()}/${year}`;
      const eventNameClean = eventName.replace(/[^a-zA-Z0-9]/g, '_');
      const timestamp = Date.now();
      
      const uploadOptions = {
        folder: folderPath,
        public_id: `${eventNameClean}_${timestamp}`,
        transformation: [
          { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        tags: [category.toLowerCase(), year.toString(), 'photographer'],
        ...options
      };

      const result = await cloudinary.uploader.upload(filePath, uploadOptions);
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        folder: folderPath,
        thumbnailUrl: this.generateThumbnailUrl(result.public_id)
      };
    } catch (error) {
      console.error('Error uploading photo by category:', error);
      throw new Error('Failed to upload photo to cloud storage');
    }
  }

  /**
   * Search photos in gallery by year
   * @param {number} year - Optional year filter
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Array<object>>} - Search results
   */
  static async searchPhotosInGallery(year = null, maxResults = 50) {
    try {
      let expression;
      if (year) {
        expression = `folder:pratishtha/photographer/gallery/${year}`;
      } else {
        expression = 'folder:pratishtha/photographer/gallery/*';
      }

      const result = await cloudinary.search
        .expression(expression)
        .max_results(maxResults)
        .sort_by([['created_at', 'desc']])
        .execute();

      return result.resources.map(resource => ({
        publicId: resource.public_id,
        url: resource.secure_url,
        thumbnailUrl: this.generateThumbnailUrl(resource.public_id),
        width: resource.width,
        height: resource.height,
        format: resource.format,
        bytes: resource.bytes,
        createdAt: resource.created_at,
        folder: resource.folder,
        tags: resource.tags
      }));
    } catch (error) {
      console.error('Error searching photos in gallery:', error);
      throw new Error('Failed to search photos in gallery');
    }
  }

  /**
   * Search photos by category (backward compatibility - searches gallery by database records)
   * @param {string} category - Event category to search
   * @param {number} year - Optional year filter
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Array<object>>} - Search results
   */
  static async searchPhotosByCategory(category, year = null, maxResults = 50) {
    // Since all photos are now in gallery folders, we need to search by database records
    // This function is kept for backward compatibility but should use database queries
    console.warn('searchPhotosByCategory is deprecated. Use searchPhotosInGallery with database filtering instead.');
    return this.searchPhotosInGallery(year, maxResults);
  }

  /**
   * Get folder structure for photographer photos (organized by year in gallery)
   * @returns {Promise<object>} - Folder structure with counts by year
   */
  static async getPhotographerFolderStructure() {
    try {
      // Get all photos from the gallery folder
      const result = await cloudinary.search
        .expression('folder:pratishtha/photographer/gallery/*')
        .aggregate('folder')
        .execute();

      const structure = {
        gallery: {
          totalPhotos: result.total_count || 0,
          yearFolders: {},
          formats: result.aggregations?.format || {}
        }
      };

      // Organize by year folders
      if (result.aggregations?.folder) {
        Object.keys(result.aggregations.folder).forEach(folderPath => {
          const yearMatch = folderPath.match(/gallery\/(\d{4})$/);
          if (yearMatch) {
            const year = yearMatch[1];
            structure.gallery.yearFolders[year] = result.aggregations.folder[folderPath];
          }
        });
      }

      return structure;
    } catch (error) {
      console.error('Error getting folder structure:', error);
      throw new Error('Failed to get folder structure');
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   * @param {string} cloudinaryUrl - Full Cloudinary URL
   * @returns {string|null} - Extracted public_id or null if extraction fails
   */
  static extractPublicIdFromUrl(cloudinaryUrl) {
    if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') {
      console.log('Invalid URL provided:', cloudinaryUrl);
      return null;
    }

    try {
      console.log('Extracting public_id from URL:', cloudinaryUrl);
      
      // Standard Cloudinary URL format:
      // https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder_path}/{filename}.{format}
      // or
      // https://res.cloudinary.com/{cloud_name}/image/upload/{folder_path}/{filename}.{format}
      
      const url = new URL(cloudinaryUrl);
      const pathParts = url.pathname.split('/').filter(part => part); // Remove empty parts
      
      console.log('Path parts:', pathParts);
      
      // Find the 'upload' segment
      const uploadIndex = pathParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1) {
        console.warn('No "upload" segment found in URL');
        return null;
      }
      
      // Get everything after 'upload'
      const afterUpload = pathParts.slice(uploadIndex + 1);
      console.log('After upload parts:', afterUpload);
      
      if (afterUpload.length === 0) {
        console.warn('No path after upload segment');
        return null;
      }
      
      // Check if first part after upload is a version (v1234567890)
      let startIndex = 0;
      if (afterUpload[0] && afterUpload[0].match(/^v\d+$/)) {
        startIndex = 1; // Skip version number
        console.log('Skipping version:', afterUpload[0]);
      }
      
      // Get all remaining parts (folder + filename)
      const publicIdParts = afterUpload.slice(startIndex);
      
      if (publicIdParts.length === 0) {
        console.warn('No public_id parts found');
        return null;
      }
      
      // Join all parts and remove file extension from the last part
      let publicId = publicIdParts.join('/');
      
      // Remove file extension if present
      const lastDotIndex = publicId.lastIndexOf('.');
      if (lastDotIndex > 0) {
        const extensionPart = publicId.substring(lastDotIndex);
        // Only remove extension if it looks like a valid image format
        if (extensionPart.match(/^\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) {
          publicId = publicId.substring(0, lastDotIndex);
        }
      }
      
      console.log('Extracted public_id:', publicId);
      return publicId;
      
    } catch (error) {
      console.error('Error extracting public_id from URL:', error);
      return null;
    }
  }

  /**
   * Validate Cloudinary configuration
   * @returns {boolean} - True if configuration is valid
   */
  static validateConfiguration() {
    const requiredEnvVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY', 
      'CLOUDINARY_API_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing Cloudinary environment variables:', missingVars);
      return false;
    }

    return true;
  }
}

// Export cloudinary instance for direct use if needed
export { cloudinary };

export default CloudStorageService;