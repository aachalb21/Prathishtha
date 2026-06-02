import ScTeam from "../../models/Admin/Sc_team.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary storage for SC team profile pics
const scTeamStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "pratishtha/sc_pics",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 500, height: 600, crop: "fill", gravity: "face", quality: "auto:good" },
      { fetch_format: "auto" },
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const name = req.body.name ? req.body.name.replace(/[^a-zA-Z0-9]/g, "_") : "member";
      return `${name}_${timestamp}`;
    },
  },
});

// Multer configuration for SC team profile uploads
export const uploadScTeamPhoto = multer({
  storage: scTeamStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

/**
 * Add a new council member
 * POST /api/admin/sc-team
 */
export const addCouncilMember = async (req, res) => {
  try {
    const { name, role, instagram, linkedin, category, order } = req.body;

    // Validate required fields
    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: "Name and role are required",
      });
    }

    // Build social links array
    const socialLinks = [];
    if (instagram) {
      socialLinks.push({ platform: "instagram", url: instagram });
    }
    if (linkedin) {
      socialLinks.push({ platform: "linkedin", url: linkedin });
    }

    // Get profile image URL from uploaded file
    let profileImage = null;
    if (req.file) {
      profileImage = req.file.path;
    }

    // Create new council member
    const newMember = new ScTeam({
      name,
      role,
      socialLinks,
      profileImage,
      category: category || null,
      order: order ? parseInt(order) : 0,
      isActive: true,
    });

    await newMember.save();

    res.status(201).json({
      success: true,
      message: "Council member added successfully",
      data: newMember,
    });
  } catch (error) {
    console.error("Error adding council member:", error);

    // If there was an uploaded image, delete it on error
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(`pratishtha/sc_pics/${req.file.filename}`);
      } catch (deleteError) {
        console.error("Error deleting uploaded image:", deleteError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to add council member",
      error: error.message,
    });
  }
};

/**
 * Get all council members
 * GET /api/admin/sc-team
 */
export const getAllCouncilMembers = async (req, res) => {
  try {
    const { category, isActive } = req.query;

    // Build filter object
    const filter = {};
    if (category) {
      filter.category = category;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const members = await ScTeam.find(filter).sort({ category: 1, order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    console.error("Error fetching council members:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch council members",
      error: error.message,
    });
  }
};

/**
 * Get council members grouped by category
 * GET /api/admin/sc-team/grouped
 */
export const getCouncilMembersGrouped = async (req, res) => {
  try {
    const members = await ScTeam.find({ isActive: true }).sort({ order: 1, createdAt: -1 });

    // Group members by category
    const grouped = members.reduce((acc, member) => {
      const category = member.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(member);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.error("Error fetching grouped council members:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch council members",
      error: error.message,
    });
  }
};

/**
 * Get a single council member by ID
 * GET /api/admin/sc-team/:id
 */
export const getCouncilMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await ScTeam.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Council member not found",
      });
    }

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error("Error fetching council member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch council member",
      error: error.message,
    });
  }
};

/**
 * Update a council member
 * PUT /api/admin/sc-team/:id
 */
export const updateCouncilMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, instagram, linkedin, category, order, isActive } = req.body;

    const member = await ScTeam.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Council member not found",
      });
    }

    // Update fields
    if (name) member.name = name;
    if (role) member.role = role;
    if (category !== undefined) member.category = category;
    if (order !== undefined) member.order = parseInt(order);
    if (isActive !== undefined) member.isActive = isActive;

    // Update social links
    if (instagram !== undefined || linkedin !== undefined) {
      const socialLinks = [];
      if (instagram) {
        socialLinks.push({ platform: "instagram", url: instagram });
      }
      if (linkedin) {
        socialLinks.push({ platform: "linkedin", url: linkedin });
      }
      member.socialLinks = socialLinks;
    }

    // Update profile image if new one uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (member.profileImage) {
        try {
          const publicId = member.profileImage.split("/").slice(-2).join("/").split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error("Error deleting old image:", deleteError);
        }
      }
      member.profileImage = req.file.path;
    }

    await member.save();

    res.status(200).json({
      success: true,
      message: "Council member updated successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error updating council member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update council member",
      error: error.message,
    });
  }
};

/**
 * Delete a council member
 * DELETE /api/admin/sc-team/:id
 */
export const deleteCouncilMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await ScTeam.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Council member not found",
      });
    }

    // Delete profile image from Cloudinary
    if (member.profileImage) {
      try {
        const publicId = member.profileImage.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error("Error deleting image:", deleteError);
      }
    }

    await ScTeam.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Council member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting council member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete council member",
      error: error.message,
    });
  }
};
