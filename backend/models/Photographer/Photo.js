import mongoose from "mongoose";

const PhotoSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	year: {
		type: Number,
		required: true,
		min: 2020,
		max: new Date().getFullYear() + 1,
	},
	eventName: {
		type: String,
		required: true,
		trim: true,
	},
	eventCategory: {
		type: String,
		required: true,
		enum: ["Aurum", "Yuva", "Olympus", "Verve", "Others"],
	},
	description: {
		type: String,
		required: true,
		trim: true,
		maxLength: 1000,
	},
	// Cloudinary storage details
	imageUrl: {
		type: String,
		required: true,
	},
	publicId: {
		type: String,
		required: true,
	},
	thumbnailUrl: {
		type: String,
	},
	// Image metadata
	width: {
		type: Number,
	},
	height: {
		type: Number,
	},
	format: {
		type: String,
	},
	bytes: {
		type: Number,
	},
	// Admin who uploaded the photo
	uploadedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Admin",
		required: true,
	},
	// Status and visibility
	isActive: {
		type: Boolean,
		default: true,
	},
	isFeatured: {
		type: Boolean,
		default: false,
	},
	// Metadata
	tags: [{
		type: String,
		trim: true,
	}],
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Create indexes for better query performance
PhotoSchema.index({ eventCategory: 1, year: 1 });
PhotoSchema.index({ eventName: 1 });
PhotoSchema.index({ isActive: 1, isFeatured: 1 });
PhotoSchema.index({ createdAt: -1 });

// Middleware to update updatedAt on save
PhotoSchema.pre('save', function(next) {
	if (this.isModified() && !this.isNew) {
		this.updatedAt = Date.now();
	}
	next();
});

// Virtual for responsive URLs
PhotoSchema.virtual('responsiveUrls').get(function() {
	const baseUrl = this.publicId;
	return {
		thumbnail: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_300,c_fill,q_auto:low/${baseUrl}`,
		medium: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_600,c_limit,q_auto:good/${baseUrl}`,
		large: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_1200,h_900,c_limit,q_auto:good/${baseUrl}`,
		original: this.imageUrl
	};
});

// Ensure virtual fields are serialized
PhotoSchema.set('toJSON', { virtuals: true });
PhotoSchema.set('toObject', { virtuals: true });

export default mongoose.model("Photo", PhotoSchema);