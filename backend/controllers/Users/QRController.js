import User from "../../models/User/Users.js";
import { generateUserQRBuffer, regenerateUserQR, decodeQRData } from "../../utils/qrGenerator.js";

/**
 * Get user's QR code
 * @route GET /api/user/qr-code/:userId
 */
export const getUserQRCode = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user by ID
    const user = await User.findById(userId).select('name student_prn qrCode');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Check if QR code exists
    if (!user.qrCode || !user.qrCode.url) {
      return res.status(404).json({
        success: false,
        message: "QR code not found for this user",
        code: "QR_NOT_FOUND"
      });
    }

    res.status(200).json({
      success: true,
      message: "QR code retrieved successfully",
      data: {
        qrCode: user.qrCode,
        user: {
          id: user._id,
          name: user.name,
          prn: user.student_prn
        }
      }
    });

  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * Download user's QR code as image
 * @route GET /api/user/qr-code/:userId/download
 */
export const downloadUserQRCode = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user by ID
    const user = await User.findById(userId).select('name student_prn');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Generate QR code buffer
    const qrBuffer = await generateUserQRBuffer(
      user._id.toString(),
      user.student_prn,
      user.name
    );

    // Set appropriate headers for image download
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qr_code_${user.student_prn}.png"`,
      'Content-Length': qrBuffer.length
    });

    res.status(200).send(qrBuffer);

  } catch (error) {
    console.error("Download QR code error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate QR code",
      code: "QR_GENERATION_FAILED"
    });
  }
};

/**
 * Regenerate user's QR code
 * @route POST /api/user/qr-code/:userId/regenerate
 */
export const regenerateQRCode = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Regenerate QR code
    const qrResult = await regenerateUserQR(user);
    
    // Update user with new QR code
    user.qrCode = {
      url: qrResult.qrCodeUrl,
      publicId: qrResult.qrCodePublicId,
      generatedAt: new Date(),
      data: qrResult.qrData
    };
    
    await user.save();

    res.status(200).json({
      success: true,
      message: "QR code regenerated successfully",
      data: {
        qrCode: user.qrCode,
        user: {
          id: user._id,
          name: user.name,
          prn: user.student_prn
        }
      }
    });

  } catch (error) {
    console.error("Regenerate QR code error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to regenerate QR code",
      code: "QR_REGENERATION_FAILED"
    });
  }
};

/**
 * Verify QR code and get user details
 * @route POST /api/user/verify-qr
 */
