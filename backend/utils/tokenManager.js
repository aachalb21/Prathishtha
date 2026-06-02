import crypto from "crypto";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/Admin/RefreshToken.js";

/**
 * Generate a secure random refresh token
 */
export const generateSecureToken = () => {
	return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash a token for secure storage
 */
export const hashToken = (token) => {
	return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Create and store refresh token in database
 */
export const createRefreshToken = async (adminId, deviceInfo) => {
	try {
		// Generate secure random token
		const token = generateSecureToken();
		const tokenHash = hashToken(token);
		
		// Set expiration (7 days from now)
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		// Create refresh token in database
		const refreshTokenDoc = new RefreshToken({
			adminId,
			tokenHash, // Store hashed version for verification (not plain token)
			deviceInfo,
			expiresAt,
		});

		await refreshTokenDoc.save();
		
		return token; // Return plain token to send to client
	} catch (error) {
		throw new Error(`Failed to create refresh token: ${error.message}`);
	}
};

/**
 * Verify and validate refresh token
 */
export const verifyRefreshToken = async (token) => {
	try {
		const tokenHash = hashToken(token);
		
		// Find active token in database
		const refreshTokenDoc = await RefreshToken.findOne({
			tokenHash,
			isActive: true,
		}).populate('adminId');

		if (!refreshTokenDoc) {
			throw new Error('Invalid refresh token');
		}

		// Check if token is expired
		if (refreshTokenDoc.isExpired()) {
			// Mark as inactive
			refreshTokenDoc.isActive = false;
			await refreshTokenDoc.save();
			throw new Error('Refresh token expired');
		}

		// Update last used timestamp
		refreshTokenDoc.lastUsedAt = new Date();
		await refreshTokenDoc.save();

		return refreshTokenDoc;
	} catch (error) {
		throw new Error(`Token verification failed: ${error.message}`);
	}
};

/**
 * Revoke a specific refresh token
 */
export const revokeRefreshToken = async (token) => {
	try {
		const tokenHash = hashToken(token);
		
		const result = await RefreshToken.updateOne(
			{ tokenHash, isActive: true },
			{ isActive: false }
		);

		return result.modifiedCount > 0;
	} catch (error) {
		throw new Error(`Failed to revoke token: ${error.message}`);
	}
};

/**
 * Revoke all refresh tokens for an admin (logout everywhere)
 */
export const revokeAllRefreshTokens = async (adminId) => {
	try {
		const result = await RefreshToken.updateMany(
			{ adminId, isActive: true },
			{ isActive: false }
		);

		return result.modifiedCount;
	} catch (error) {
		throw new Error(`Failed to revoke all tokens: ${error.message}`);
	}
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (admin) => {
	const tokenPayload = {
		id: admin._id,
		email: admin.email,
		role: admin.role,
		iat: Math.floor(Date.now() / 1000),
	};

	return jwt.sign(
		tokenPayload,
		process.env.ACCESS_TOKEN_SECRET,
		{ 
			expiresIn: "15m",
			issuer: "Pratishtha-backend",
			audience: "Pratishtha-admin"
		}
	);
};

/**
 * Clean up expired tokens (run this periodically)
 */
export const cleanupExpiredTokens = async () => {
	try {
		const result = await RefreshToken.cleanupExpired();
		console.log(`Cleaned up ${result.deletedCount} expired tokens`);
		return result.deletedCount;
	} catch (error) {
		console.error('Token cleanup failed:', error.message);
		throw error;
	}
};
