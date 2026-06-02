/**
 * Utility function to sanitize user data by removing sensitive fields
 * @param {Object} user - User document or user data object
 * @returns {Object} - Sanitized user data
 */
export const sanitizeUserData = (user) => {
  if (!user) return null;
  
  // Convert Mongoose document to plain object to preserve populated fields
  const userData = user.toObject ? user.toObject() : (user._doc || user);
  
  return {
    ...userData,
    password: undefined,
    OTP: undefined,
    OTPExpiresAt: undefined,
    resetPasswordToken: undefined,
    resetPasswordExpiresAt: undefined,
    // Keep QR code information as it's needed for frontend
    qrCode: userData.qrCode ? {
      url: userData.qrCode.url,
      generatedAt: userData.qrCode.generatedAt,
      data: userData.qrCode.data
    } : undefined
  };
};

/**
 * Sanitize an array of user objects
 * @param {Array} users - Array of user documents or objects
 * @returns {Array} - Array of sanitized user data
 */
export const sanitizeUserArray = (users) => {
  if (!Array.isArray(users)) return [];
  
  return users.map(user => sanitizeUserData(user));
};

export default {
  sanitizeUserData,
  sanitizeUserArray
};