import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
	},
	password: {
		type: String,
		required: true,
	},
	role: {
		type: String,
		enum: ["SuperAdmin", "Admin","Aurum","Yuva","Olympus","Verve", "Photographer", "EventCoordinator", "none"],
		default: "none",
	},
	eventCategory: {
		type: String,
		enum: ["Aurum", "Yuva", "Olympus", "Verve"],
		required: function() {
			return this.role === 'EventCoordinator';
		}
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	loginAt: {
		type: Date,
		default: null,
	},
});

export default mongoose.model("Admin", AdminSchema);
