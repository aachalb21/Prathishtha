import Admin from "../../models/Admin/Admin.js";

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

// Get current admin info
export const getCurrentAdmin = async (req, res) => {
    try {
        const adminId = req.admin.id;
        
        // Find admin by ID
        const admin = await Admin.findById(adminId);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            success: true,
            admin: sanitizeAdminData(admin)
        });
    } catch (error) {
        console.error('Get current admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
