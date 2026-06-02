import jwt from "jsonwebtoken";

/**
 * Generate access and refresh tokens for a user
 * @param {Object} user - User object containing id, email, role
 * @returns {Object} Object containing accessToken and refreshToken
 */
export const generateTokens = (user) => {
	const tokenPayload = {
		id: user.id || user._id,
		email: user.email,
		role: user.role,
		iat: Math.floor(Date.now() / 1000), // Issued at time
	};

	const accessToken = jwt.sign(
		tokenPayload,
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: "15m",
			issuer: "Pratishtha-backend",
			audience: "Pratishtha-admin"
		}
	);

	const refreshToken = jwt.sign(
		{
			...tokenPayload,
			tokenType: "refresh"
		},
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: "7d",
			issuer: "Pratishtha-backend",
			audience: "Pratishtha-admin"
		}
	);

	return {
		accessToken,
		refreshToken
	};
};

/**
 * Generate only access token (used for token refresh)
 * @param {Object} user - User object containing id, email, role
 * @returns {String} Access token
 */
export const generateAccessToken = (user) => {
	const tokenPayload = {
		id: user.id || user._id,
		email: user.email,
		role: user.role,
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
