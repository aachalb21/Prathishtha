import jwt from "jsonwebtoken";
import User from "../../models/User/Users.js";
import { configDotenv } from "dotenv";
configDotenv();

export const checkAuth = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ message: "Access token not provided" });
		}
		const token = authHeader.split(" ")[1];
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
			issuer: "Pratishtha-backend",
			audience: "Pratishtha-admin"
		});
		// Check if user still exists
		const user = await User.findById(decoded.id);
		if (!user) {
			return res.status(401).json({ message: "User account no longer exists" });
		}
		// Attach user info to request
		req.user = {
			id: user._id,
			email: user.email,
			name: user.name,
			role: user.role
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
