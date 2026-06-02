import QRCode from 'qrcode';
import { cloudinary } from './cloudStorage.js';

/**
 * Generate QR code for user profile
 * @param {string} userId - The user's MongoDB ObjectId
 * @param {string} prn - The user's PRN (Personal Registration Number)
 * @param {string} name - The user's name
 * @returns {Promise<string>} - Returns the QR code data URL or Cloudinary URL
 */
export const generateUserQR = async (userId, prn, name) => {
  try {
    // Create QR data with user information
    const qrData = {
      userId: userId,
      prn: prn,
      name: name,
      type: 'user_profile',
      generatedAt: new Date().toISOString(),
      // Add verification URL for mobile scanning
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-user/${userId}`
    };

    // Convert to JSON string
    const qrDataString = JSON.stringify(qrData);
    
    // Generate QR code options
    const qrOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',  // Black dots
        light: '#FFFFFF'  // White background
      },
      width: 300,
      errorCorrectionLevel: 'M'
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrDataString, qrOptions);
    
    // Upload to Cloudinary for permanent storage
    try {
      const uploadResult = await cloudinary.uploader.upload(qrCodeDataURL, {
        folder: 'pratishtha/qr',
        public_id: `user_qr_${userId}_${Date.now()}`,
        resource_type: 'image',
        format: 'png',
        transformation: [
          { width: 300, height: 300, crop: 'fit' },
          { quality: 'auto' }
        ]
      });

      return {
        qrCodeUrl: uploadResult.secure_url,
        qrCodePublicId: uploadResult.public_id,
        qrData: qrData
      };
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed:', cloudinaryError);
      // Return data URL as fallback
      return {
        qrCodeUrl: qrCodeDataURL,
        qrCodePublicId: null,
        qrData: qrData
      };
    }

  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code as buffer (for immediate response)
 * @param {string} userId - The user's MongoDB ObjectId
 * @param {string} prn - The user's PRN
 * @param {string} name - The user's name
 * @returns {Promise<Buffer>} - Returns QR code as buffer
 */
export const generateUserQRBuffer = async (userId, prn, name) => {
  try {
    const qrData = {
      userId: userId,
      prn: prn,
      name: name,
      type: 'user_profile',
      generatedAt: new Date().toISOString(),
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-user/${userId}`
    };

    const qrDataString = JSON.stringify(qrData);
    
    const qrOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300,
      errorCorrectionLevel: 'M'
    };

    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(qrDataString, qrOptions);
    return qrBuffer;

  } catch (error) {
    console.error('QR Code buffer generation error:', error);
    throw new Error('Failed to generate QR code buffer');
  }
};

/**
 * Decode QR data (for verification)
 * @param {string} qrDataString - The QR code data string
 * @returns {Object} - Parsed QR data object
 */
export const decodeQRData = (qrDataString) => {
  try {
    return JSON.parse(qrDataString);
  } catch (error) {
    console.error('QR decode error:', error);
    throw new Error('Invalid QR code data');
  }
};

/**
 * Regenerate QR code for existing user
 * @param {Object} user - User object from database
 * @returns {Promise<Object>} - Returns QR code data
 */
export const regenerateUserQR = async (user) => {
  try {
    // Delete old QR code from Cloudinary if exists
    if (user.qrCode && user.qrCode.publicId) {
      try {
        await cloudinary.uploader.destroy(user.qrCode.publicId);
      } catch (deleteError) {
        console.warn('Could not delete old QR code:', deleteError.message);
      }
    }

    // Generate new QR code
    const qrResult = await generateUserQR(
      user._id.toString(),
      user.student_prn,
      user.name
    );

    return qrResult;
  } catch (error) {
    console.error('QR regeneration error:', error);
    throw new Error('Failed to regenerate QR code');
  }
};

/**
 * Generate QR code for team attendance verification (temporary - for email only)
 * @param {string} teamId - The team's MongoDB ObjectId
 * @param {string} eventId - The event's MongoDB ObjectId
 * @param {string} teamName - The team's name
 * @param {string} eventName - The event name
 * @param {string} joinToken - The team's join token
 * @returns {Promise<Buffer>} - Returns QR code as buffer
 */
export const generateTeamQRBuffer = async (teamId, eventId, teamName, eventName, joinToken) => {
  try {
    // Create QR data with team information for attendance/registration verification
    const qrData = {
      teamId: teamId,
      eventId: eventId,
      teamName: teamName,
      eventName: eventName,
      joinToken: joinToken,
      type: 'team_registration',
      generatedAt: new Date().toISOString(),
      // Verification URL for admin scanning
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/verify-team/${teamId}`
    };

    // Convert to JSON string
    const qrDataString = JSON.stringify(qrData);
    
    // Generate QR code options
    const qrOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#667eea',  // Purple dots matching theme
        light: '#FFFFFF'  // White background
      },
      width: 400,
      errorCorrectionLevel: 'H'
    };

    // Generate QR code as buffer (temporary, not stored)
    const qrBuffer = await QRCode.toBuffer(qrDataString, qrOptions);
    return qrBuffer;

  } catch (error) {
    console.error('Team QR Code generation error:', error);
    throw new Error('Failed to generate team QR code');
  }
};

/**
 * Generate QR code for team join
 * @param {string} teamId - The team's MongoDB ObjectId
 * @param {string} joinToken - The team's join token
 * @param {string} teamName - The team's name
 * @param {string} eventName - The event name
 * @returns {Promise<Object>} - Returns the QR code URL and data
 */
export const generateTeamQR = async (teamId, joinToken, teamName, eventName) => {
  try {
    // Create QR data with team information
    const qrData = {
      teamId: teamId,
      joinToken: joinToken,
      teamName: teamName,
      eventName: eventName,
      type: 'team_join',
      generatedAt: new Date().toISOString(),
      // Add join URL for mobile scanning
      joinUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/join-team/${joinToken}`
    };

    // Convert to JSON string
    const qrDataString = JSON.stringify(qrData);
    
    // Generate QR code options
    const qrOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#667eea',  // Purple dots matching theme
        light: '#FFFFFF'  // White background
      },
      width: 400,
      errorCorrectionLevel: 'H'
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrDataString, qrOptions);
    
    // Upload to Cloudinary for permanent storage
    try {
      const uploadResult = await cloudinary.uploader.upload(qrCodeDataURL, {
        folder: 'pratishtha/teams/qr',
        public_id: `team_qr_${teamId}_${Date.now()}`,
        resource_type: 'image',
        format: 'png',
        transformation: [
          { width: 400, height: 400, crop: 'fit' },
          { quality: 'auto' }
        ]
      });

      return {
        qrCodeUrl: uploadResult.secure_url,
        qrCodePublicId: uploadResult.public_id,
        qrData: qrData
      };
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed:', cloudinaryError);
      // Return data URL as fallback
      return {
        qrCodeUrl: qrCodeDataURL,
        qrCodePublicId: null,
        qrData: qrData
      };
    }

  } catch (error) {
    console.error('Team QR Code generation error:', error);
    throw new Error('Failed to generate team QR code');
  }
};
