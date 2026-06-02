import Admin from "../../models/Admin/Admin.js";
import RefreshToken from "../../models/Admin/RefreshToken.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { 
	createRefreshToken, 
	verifyRefreshToken, 
	revokeRefreshToken, 
	revokeAllRefreshTokens,
	generateAccessToken 
} from "../../utils/tokenManager.js";

// Utility function to sanitize admin data
const sanitizeAdminData = (admin) => {
  if (!admin) return null;
  
  const adminData = admin._doc || admin;
  
  return {
    ...adminData,
    password: undefined,
    refreshTokens: undefined
  };
};

export const login = async (req, res) => {
	try {
		const { email, password, platform } = req.body;
		
		// Note: Validation is now handled by middleware, but keeping these checks for safety
		if (!email || !password) {
			return res.status(400).json({ 
				message: "Email and password are required",
				code: "MISSING_CREDENTIALS"
			});
		}

		// Find admin by email
		const admin = await Admin.findOne({ email });
		if (!admin) {
			return res.status(401).json({ 
				message: "Invalid credentials",
				code: "INVALID_CREDENTIALS"
			});
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, admin.password);
		if (!isPasswordValid) {
			return res.status(401).json({ 
				message: "Invalid credentials",
				code: "INVALID_CREDENTIALS"
			});
		}

		// Update loginAt timestamp
		admin.loginAt = new Date();
		await admin.save();

		// Prepare device info for token
		const deviceInfo = {
			userAgent: req.headers['user-agent'] || 'Unknown',
			ip: req.ip || req.connection.remoteAddress || 'Unknown',
			platform: platform || 'web',
		};

		// Generate access token
		const accessToken = generateAccessToken(admin);

		// Create and store refresh token in database
		const refreshToken = await createRefreshToken(admin._id, deviceInfo);

		// Platform-specific response
		if (platform === "mobile") {
			// For mobile apps - return tokens in response body
			return res.status(200).json({
				message: "Login successful",
				admin: sanitizeAdminData(admin),
				accessToken,
				refreshToken,
				tokenType: "Bearer",
			});
		} else {
			// For web - set refresh token as httpOnly cookie and return access token
			res.cookie("refreshToken", refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" for cross-origin in production, "lax" for dev
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			return res.status(200).json({
				message: "Login successful",
				admin: sanitizeAdminData(admin),
				accessToken,
				tokenType: "Bearer",
			});
		}
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ 
			message: "Internal server error",
			code: "INTERNAL_ERROR"
		});
	}
};

export const refreshAccessToken = async (req, res) => {
	try {
		let refreshToken;

		// Get refresh token from cookie (web) or body (mobile)
		if (req.cookies?.refreshToken) {
			refreshToken = req.cookies.refreshToken;
		} else if (req.body.refreshToken) {
			refreshToken = req.body.refreshToken;
		}

		if (!refreshToken) {
			return res.status(401).json({ message: "Refresh token not provided" });
		}

		// Verify refresh token from database
		const refreshTokenDoc = await verifyRefreshToken(refreshToken);
		
		if (!refreshTokenDoc || !refreshTokenDoc.adminId) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

		const admin = refreshTokenDoc.adminId;

		// Generate new access token
		const newAccessToken = generateAccessToken(admin);

		res.status(200).json({
			message: "Token refreshed successfully",
			accessToken: newAccessToken,
			tokenType: "Bearer",
		});
	} catch (error) {
		console.error('Token refresh error:', error);
		
		// Handle specific error types
		if (error.message.includes('Invalid') || error.message.includes('expired')) {
			return res.status(401).json({ message: error.message });
		}
		
		res.status(500).json({ message: "Internal server error" });
	}
};

export const logout = async (req, res) => {
	try {
		const { platform } = req.body;
		let refreshToken;

		// Get refresh token from cookie (web) or body (mobile)
		if (req.cookies?.refreshToken) {
			refreshToken = req.cookies.refreshToken;
		} else if (req.body.refreshToken) {
			refreshToken = req.body.refreshToken;
		}

		// Revoke refresh token from database if provided
		if (refreshToken) {
			await revokeRefreshToken(refreshToken);
		}

		if (platform === "web") {
			// Clear refresh token cookie for web
			res.clearCookie("refreshToken");
		}

		res.status(200).json({ message: "Logout successful" });
	} catch (error) {
		console.error('Logout error:', error);
		// Still send success response even if token revocation fails
		// to avoid blocking logout process
		res.status(200).json({ message: "Logout successful" });
	}
};

// New endpoint: Logout from all devices
export const logoutAll = async (req, res) => {
	try {
		const adminId = req.admin.id; // From auth middleware
		
		// Revoke all refresh tokens for this admin
		const revokedCount = await revokeAllRefreshTokens(adminId);
		
		// Clear cookie if web platform
		res.clearCookie("refreshToken");
		
		res.status(200).json({ 
			message: `Logged out from all devices successfully`,
			sessionsRevoked: revokedCount
		});
	} catch (error) {
		console.error('Logout all error:', error);
		res.status(500).json({ message: "Internal server error" });
	}
};
