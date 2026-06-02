import User from "../../models/User/Users.js";
import sendOTP from "../../utils/Email/SendOTP.js";
import { generateTokens } from "../../utils/token.js";
import { sanitizeUserData } from "../../utils/sanitizeUserData.js";
import Joi from 'joi';

// Verification validation schemas
const verifyEmailSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .max(255)
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'string.empty': 'OTP is required',
      'any.required': 'OTP is required'
    })
});

const resendOTPSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .max(255)
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    })
});

const updateEmailSchema = Joi.object({
  oldEmail: Joi.string()
    .email()
    .required()
    .max(255)
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid current email address',
      'string.empty': 'Current email is required',
      'any.required': 'Current email is required'
    }),
  newEmail: Joi.string()
    .email()
    .required()
    .max(255)
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid new email address',
      'string.empty': 'New email is required',
      'any.required': 'New email is required'
    })
});

/**
 * Generate and send OTP to user's email
 */
const generateAndSendOTP = async (user) => {
  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP to user document
    user.OTP = otp;
    user.OTPExpiresAt = otpExpiry;
    await user.save();

    // Send OTP email
    await sendOTP(user.email, otp);

    return { success: true };
  } catch (error) {
    console.error('Error generating/sending OTP:', error);
    return { success: false, error: 'Failed to send OTP email' };
  }
};

/**
 * Verify email with OTP
 */
export const verifyEmail = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = verifyEmailSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }

    const { email, otp } = value;
    console.log(`Verification attempt for email: ${email} with OTP: ${otp}`);

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified',
        code: 'ALREADY_VERIFIED'
      });
    }

    // Check if OTP exists and is not expired
    if (!user.OTP || !user.OTPExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.',
        code: 'NO_OTP_FOUND'
      });
    }

    if (new Date() > user.OTPExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
        code: 'OTP_EXPIRED'
      });
    }
    console.log(`Stored OTP: ${user.OTP}, Expires At: ${user.OTPExpiresAt}`);
    console.log(`OTP types - Stored: ${typeof user.OTP}, Input: ${typeof otp}`);
    console.log(`OTP values - Stored: "${user.OTP}", Input: "${otp}"`);

    // Verify OTP - ensure both are strings for comparison
    const storedOTP = user.OTP.toString();
    const inputOTP = otp.toString();
    
    if (storedOTP !== inputOTP) {
      console.log(`OTP mismatch - Stored: "${storedOTP}", Input: "${inputOTP}"`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.',
        code: 'INVALID_OTP'
      });
    }

    console.log('OTP verification successful, marking user as verified');

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.OTP = undefined;
    user.OTPExpiresAt = undefined;
    // user.verifiedAt = new Date();
    await user.save();

    // Generate new tokens with verified status
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: 'user', // Now fully verified user
      prn: user.student_prn
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Prepare user data to send
    const userData = sanitizeUserData(user);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log(`Email verified successfully for user: ${user.email} at ${new Date().toISOString()}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        accessToken,
        refreshToken,
        user: userData
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    
    res.status(500).json({
      success: false,
      message: 'An error occurred during verification. Please try again.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Resend OTP to user's email
 */
export const resendOTP = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = resendOTPSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }

    const { email } = value;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified',
        code: 'ALREADY_VERIFIED'
      });
    }

    // Check rate limiting (optional - prevent spam)
    const lastOTPTime = user.OTPExpiresAt ? new Date(user.OTPExpiresAt.getTime() - 10 * 60 * 1000) : null;
    const now = new Date();
    const timeSinceLastOTP = lastOTPTime ? now - lastOTPTime : Infinity;
    
    if (timeSinceLastOTP < 60 * 1000) { // 1 minute rate limit
      const remainingTime = Math.ceil((60 * 1000 - timeSinceLastOTP) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingTime} seconds before requesting a new OTP`,
        code: 'RATE_LIMITED'
      });
    }

    // Generate and send new OTP
    const result = await generateAndSendOTP(user);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error,
        code: 'SEND_OTP_FAILED'
      });
    }

    console.log(`OTP resent to user: ${user.email} at ${new Date().toISOString()}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      data: {
        email: user.email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending OTP. Please try again.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Check verification status
 */
export const checkVerificationStatus = async (req, res) => {
  try {
    // User should be attached to req by auth middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Get user data from database
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification status retrieved',
      data: {
        isVerified: user.isVerified,
        email: user.email,
        hasOTP: !!user.OTPExpiresAt && new Date() < user.OTPExpiresAt
      }
    });

  } catch (error) {
    console.error('Check verification status error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error checking verification status',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Update email for unverified user
 * Allows users to correct their email during verification
 */
export const updateEmail = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateEmailSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }

    const { oldEmail, newEmail } = value;

    // Don't allow same email
    if (oldEmail === newEmail) {
      return res.status(400).json({
        success: false,
        message: 'New email must be different from current email',
        code: 'SAME_EMAIL'
      });
    }

    // Find user by old email
    const user = await User.findOne({ email: oldEmail.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
        code: 'USER_NOT_FOUND'
      });
    }

    // Only allow email change for unverified users
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change email for already verified accounts',
        code: 'ALREADY_VERIFIED'
      });
    }

    // Check if new email is already taken by another user
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered to another account',
        code: 'EMAIL_TAKEN'
      });
    }

    // Update user's email
    user.email = newEmail.toLowerCase();

    // Generate and send new OTP to new email
    const result = await generateAndSendOTP(user);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP to new email',
        code: 'SEND_OTP_FAILED'
      });
    }

    console.log(`Email updated from ${oldEmail} to ${newEmail} for user: ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'Email updated successfully. A new OTP has been sent to your new email.',
      data: {
        email: user.email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Update email error:', error);

    res.status(500).json({
      success: false,
      message: 'An error occurred while updating email. Please try again.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export default {
  verifyEmail,
  resendOTP,
  checkVerificationStatus,
  generateAndSendOTP,
  updateEmail
};