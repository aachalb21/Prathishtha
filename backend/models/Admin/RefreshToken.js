import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
	adminId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Admin",
		required: true,
		index: true, // Index for faster queries
	},
	tokenHash: {
		type: String,
		required: true,
		unique: true,
		index: true, // Store hashed version for security
	},
	deviceInfo: {
		userAgent: String,
		ip: String,
		platform: {
			type: String,
			enum: ["web", "mobile"],
			default: "web",
		},
	},
	isActive: {
		type: Boolean,
		default: true,
		index: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 604800, // Auto-delete after 7 days (7 * 24 * 60 * 60)
	},
	lastUsedAt: {
		type: Date,
		default: Date.now,
	},
	expiresAt: {
		type: Date,
		required: true,
		index: true,
	},
});

// Compound index for efficient queries
RefreshTokenSchema.index({ adminId: 1, isActive: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to check if token is expired
RefreshTokenSchema.methods.isExpired = function() {
	return Date.now() >= this.expiresAt.getTime();
};

// Static method to cleanup expired tokens
RefreshTokenSchema.statics.cleanupExpired = async function() {
	return this.deleteMany({
		$or: [
			{ expiresAt: { $lt: new Date() } },
			{ isActive: false }
		]
	});
};

// Static method to revoke all tokens for an admin
RefreshTokenSchema.statics.revokeAllForAdmin = async function(adminId) {
	return this.updateMany(
		{ adminId, isActive: true },
		{ isActive: false }
	);
};

export default mongoose.model("RefreshToken", RefreshTokenSchema);
