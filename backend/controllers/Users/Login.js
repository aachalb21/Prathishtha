import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User/Users.js";
import { generateTokens } from "../../utils/token.js";
import sendOTP from "../../utils/Email/SendOTP.js";
import { sanitizeUserData } from "../../utils/sanitizeUserData.js";
import Joi from 'joi';

// User login validation schema
const userLoginSchema = Joi.object({
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
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

/**
 * User Login Controller
 * Handles user authentication and token generation
 */
export const loginUser = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = userLoginSchema.validate(req.body, {
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

    const { email, password } = value;

    // Find user by email and populate event details
    const user = await User.findOne({ email: email.toLowerCase() }).populate({
      path: 'Events_registered.event_id',
      select: 'event_id event_name event_type event_catagory event_date event_fee team_type team_size'
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user account is verified
    if (!user.isVerified) {
      try {
        // Generate new OTP and send to user's email
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Save OTP to user document
        user.OTP = otp;
        user.OTPExpiresAt = otpExpiry;
        await user.save();

        // Send OTP email
        await sendOTP(user.email, otp);
        console.log(`New OTP sent to unverified user: ${user.email} at ${new Date().toISOString()}`);

        // For unverified users, still generate tokens but with limited access
        // This allows them to access the verification page
        const tokenPayload = {
          id: user._id,
          email: user.email,
          role: 'unverified_user',
          prn: user.student_prn
        };

        const { accessToken, refreshToken } = generateTokens(tokenPayload);

        // Prepare user data for unverified user
        const userData = sanitizeUserData(user);


        return res.status(200).json({
          success: true,
          message: 'Login successful but account requires verification. A new verification code has been sent to your email.',
          code: 'ACCOUNT_NOT_VERIFIED',
          data: {
            accessToken,
            refreshToken,
            user: userData,
            requiresVerification: true,
            otpSent: true,
            otpExpiresIn: '10 minutes'
          }
        });

      } catch (otpError) {
        console.error('Error sending OTP to unverified user:', otpError);
        
        // Even if OTP fails, still allow limited login for verification page access
        const tokenPayload = {
          id: user._id,
          email: user.email,
          role: 'unverified_user',
          prn: user.student_prn
        };

        const { accessToken, refreshToken } = generateTokens(tokenPayload);

        const userData = sanitizeUserData(user);

        return res.status(200).json({
          success: true,
          message: 'Login successful but account requires verification. Please use the resend option to get a new verification code.',
          code: 'ACCOUNT_NOT_VERIFIED',
          data: {
            accessToken,
            refreshToken,
            user: userData,
            requiresVerification: true,
            otpSent: false,
            otpError: 'Failed to send verification code automatically'
          }
        });
      }
    }

    // Generate tokens
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: 'user', // Set default role for users
      prn: user.student_prn
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Update last login time
    user.loginAt = new Date();
    await user.save();

    // Prepare user data to send (exclude sensitive information)
    const userData = sanitizeUserData(user);

    // Set refresh token as HTTP-only cookie for security
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Log successful login
    console.log(`User login successful: ${user.email} at ${new Date().toISOString()}`);

    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: userData
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Send generic error message to client
    res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Check if user is authenticated
 * Used for verifying current authentication status
 */
export const checkAuth = async (req, res) => {
  try {
    // User should be attached to req by auth middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Get user data from database with populated event details
    const user = await User.findById(req.user.id).populate({
      path: 'Events_registered.event_id',
      select: 'event_id event_name event_type event_catagory event_date event_fee team_type team_size'
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified',
        code: 'ACCOUNT_NOT_VERIFIED'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User authenticated',
      data: {
        user: sanitizeUserData(user)
      }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error checking authentication status',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    // Verify refresh token (you might want to implement JWT verification here)
    // For now, we'll use a simple approach - in production, use proper JWT verification
    
    // Decode the refresh token to get user info
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Get user from database with populated event details
    const user = await User.findById(decoded.id).populate({
      path: 'Events_registered.event_id',
      select: 'event_id event_name event_type event_catagory event_date event_fee team_type team_size'
    });
    
    if (!user || !user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'User not found or not verified',
        code: 'USER_INVALID'
      });
    }

    // Generate new access token
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: 'user',
      prn: user.student_prn
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);

    // Update refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        user: sanitizeUserData(user)
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Logout user
 * Clears refresh token cookie
 */
export const logoutUser = async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export default {
  loginUser,
  checkAuth,
  refreshToken,
  logoutUser
};