import jwt from "jsonwebtoken";
import Admin from "../../models/Admin/Admin.js";
import { configDotenv } from "dotenv";
configDotenv();

export const verifyAccessToken = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		console.log("Auth header:", authHeader);
		
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ message: "Access token not provided" });
		}

		const token = authHeader.split(" ")[1];
		// console.log("Verifying token:", token);

		// Verify token with additional security checks
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
			issuer: "Pratishtha-backend",
			audience: "Pratishtha-admin"
		});
		// console.log("Decoded token:", decoded);

		// Check if admin still exists (in case admin was deleted after token was issued)
		const admin = await Admin.findById(decoded.id);
		if (!admin) {
			return res.status(401).json({ message: "Admin account no longer exists" });
		}

		// Attach admin info to request
		req.admin = {
			id: admin._id,
			email: admin.email,
			role: admin.role,
			name: admin.name,
			eventCategory: admin.eventCategory
		};

		next();
	} catch (error) {
		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({ message: "Invalid access token" });
		}
		if (error.name === "TokenExpiredError") {
			return res.status(401).json({ message: "Access token expired" });
		}
		return res.status(500).json({ message: "Token verification failed" });
	}
};

export const requireRole = (allowedRoles) => {
	return (req, res, next) => {
		console.log("Admin role:", req.admin?.role);
		if (!req.admin) {
			return res.status(401).json({ message: "Authentication required" });
		}

		if (!allowedRoles.includes(req.admin.role)) {
			return res.status(403).json({ message: "Insufficient permissions" });
		}

		next();
	};
};

// Alternative token verification for event routes (supports both access and refresh tokens)
export const verifyAdminToken = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ 
				success: false,
				message: "Access token not provided" 
			});
		}

		const token = authHeader.split(" ")[1];

		// Try to verify as access token first
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
				issuer: "Pratishtha-backend",
				audience: "Pratishtha-admin"
			});
		} catch (accessTokenError) {
			// If access token fails, try refresh token (for longer operations)
			try {
				decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, {
					issuer: "Pratishtha-backend",
					audience: "Pratishtha-admin"
				});
			} catch (refreshTokenError) {
				return res.status(401).json({ 
					success: false,
					message: "Invalid or expired token" 
				});
			}
		}

		// Check if admin still exists
		const admin = await Admin.findById(decoded.id);
		if (!admin) {
			return res.status(401).json({ 
				success: false,
				message: "Admin account no longer exists" 
			});
		}

		// Attach admin info to request
		req.admin = {
			id: admin._id,
			email: admin.email,
			role: admin.role,
			name: admin.name,
			permissions: admin.permissions || []
		};

		next();
	} catch (error) {
		console.error('Token verification error:', error);
		return res.status(500).json({ 
			success: false,
			message: "Token verification failed" 
		});
	}
};

// Permission-based authorization middleware
export const checkPermissions = (requiredPermissions = []) => {
	return (req, res, next) => {
		if (!req.admin) {
			return res.status(401).json({ 
				success: false,
				message: "Authentication required" 
			});
		}

		// SuperAdmin has all permissions
		if (req.admin.role === 'SuperAdmin') {
			return next();
		}

		// Check if admin has required permissions
		const adminPermissions = req.admin.permissions || [];
		const hasPermission = requiredPermissions.every(permission => 
			adminPermissions.includes(permission)
		);

		// Role-based fallback permissions
		const rolePermissions = {
			Admin: [
				'VIEW_EVENTS', 'CREATE_EVENT', 'UPDATE_EVENT', 'DELETE_EVENT',
				'VIEW_REGISTRATIONS', 'VIEW_ANALYTICS', 'MANAGE_USERS'
			],
			Event: [
				'VIEW_EVENTS', 'CREATE_EVENT', 'UPDATE_EVENT', 'VIEW_REGISTRATIONS'
			]
		};

		const roleBasedPermissions = rolePermissions[req.admin.role] || [];
		const hasRoleBasedPermission = requiredPermissions.every(permission => 
			roleBasedPermissions.includes(permission)
		);

		if (!hasPermission && !hasRoleBasedPermission) {
			return res.status(403).json({ 
				success: false,
				message: `Insufficient permissions. Required: ${requiredPermissions.join(', ')}` 
			});
		}

		next();
	};
};
