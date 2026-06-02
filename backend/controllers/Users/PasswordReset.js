import User from "../../models/User/Users.js";
import crypto from "crypto";
import { hashString } from "../../utils/Hashed.js";
import { sendPasswordResetEmail } from "../../utils/Email/SendPasswordResetEmail.js";

/**
 * Forgot Password - Send reset email
 * @route POST /api/users/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        code: "EMAIL_REQUIRED"
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // For security reasons, don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
        code: "RESET_EMAIL_SENT"
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiration (15 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save({ validateBeforeSave: false });

    // Send email with reset link
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetURL,
        prn: user.student_prn
      });

      res.status(200).json({
        success: true,
        message: "Password reset email sent successfully",
        code: "RESET_EMAIL_SENT"
      });

    } catch (emailError) {
      // Remove token if email sending fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiresAt = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Email sending error:", emailError);

      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
        code: "EMAIL_SEND_FAILED"
      });
    }

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * Reset Password - Reset with token
 * @route POST /api/users/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validate inputs
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Token, password, and confirm password are required",
        code: "REQUIRED_FIELDS_MISSING"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
        code: "PASSWORDS_MISMATCH"
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
        code: "PASSWORD_TOO_WEAK"
      });
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
        code: "INVALID_TOKEN"
      });
    }

    // Hash new password
    const hashedPassword = await hashString(password);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    user.loginAt = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login with your new password.",
      code: "PASSWORD_RESET_SUCCESS"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * Verify Reset Token - Check if reset token is valid
 * @route GET /api/users/auth/verify-reset-token/:token
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
        code: "TOKEN_REQUIRED"
      });
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
        code: "INVALID_TOKEN"
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      code: "VALID_TOKEN",
      data: {
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};