import Admin from "../../models/Admin/Admin.js";
import { hashString } from "../../utils/Hashed.js";

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

export const createAdmin = async (req, res) => {
	try {
		const { name, email, password, role, eventCategory } = req.body;
		
		if (!name || !email || !password || !role) {
			return res.status(400).json({ message: "All fields are required" });
		}

		// Validate role (exclude EventCoordinator from general admin creation)
		const validRoles = ["Yuva", "Olympus", "Aurum", "Verve", "Photographer", "Admin", "SuperAdmin"];
		if (!validRoles.includes(role)) {
			return res.status(400).json({ message: "Invalid role specified. Use createEventCoordinator endpoint for EventCoordinator role." });
		}

		// Check if admin already exists
		const existingAdmin = await Admin.findOne({ email });
		if (existingAdmin) {
			return res.status(409).json({ message: "Admin already exists" });
		}

		// Hash password
		const hashedPassword = await hashString(password);

		// Create admin
		const admin = await Admin.create({
			name,
			email,
			password: hashedPassword,
			role,
		});

		res.status(201).json({
			message: "Admin created successfully",
			admin: sanitizeAdminData(admin)
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Dedicated function for creating Event Coordinators
export const createEventCoordinator = async (req, res) => {
	try {
		const { name, email, password, eventCategory } = req.body;
		
		// Validate required fields
		if (!name || !email || !password || !eventCategory) {
			return res.status(400).json({ 
				message: "All fields are required (name, email, password, eventCategory)" 
			});
		}

		// Validate eventCategory
		const validCategories = ["Aurum", "Yuva", "Olympus", "Verve"];
		if (!validCategories.includes(eventCategory)) {
			return res.status(400).json({ 
				message: `Invalid event category. Valid categories: ${validCategories.join(', ')}` 
			});
		}

		// Check if admin already exists
		const existingAdmin = await Admin.findOne({ email });
		if (existingAdmin) {
			return res.status(409).json({ message: "Admin with this email already exists" });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ message: "Invalid email format" });
		}

		// Validate password strength
		if (password.length < 8) {
			return res.status(400).json({ message: "Password must be at least 8 characters long" });
		}

		// Hash password
		const hashedPassword = await hashString(password);

		// Create event coordinator
		const coordinator = await Admin.create({
			name: name.trim(),
			email: email.toLowerCase().trim(),
			password: hashedPassword,
			role: 'EventCoordinator',
			eventCategory: eventCategory
		});

		res.status(201).json({
			message: "Event Coordinator created successfully",
			coordinator: sanitizeAdminData(coordinator),
			details: {
				name: coordinator.name,
				email: coordinator.email,
				role: coordinator.role,
				eventCategory: coordinator.eventCategory,
				createdAt: coordinator.createdAt
			}
		});
	} catch (error) {
		console.error('Error creating Event Coordinator:', error);
		res.status(500).json({ 
			message: error.message || "Failed to create Event Coordinator"
		});
	}
};
