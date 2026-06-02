import User from "../../models/User/Users.js";
import sendOTP from "../../utils/Email/SendOTP.js";
import { hashString } from "../../utils/Hashed.js";
import { sanitizeUserData } from "../../utils/sanitizeUserData.js";
import { generateUserQR } from "../../utils/qrGenerator.js";


export const signup = async (req, res) => {
  try {
    const { prn, name,gender, email, password, department, year, type, college_name } = req.body;
    console.log("Signup request received:", req.body); // Debug log
    // Basic validation
    if (!prn || !name || !email || !password || !department || !year || !type) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        code: "MISSING_FIELDS",
      });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ student_prn: prn }, { email }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this PRN or email already exists",
        code: "USER_EXISTS",
      });
    }
    // Create new user
    const newUser = new User({
      student_prn: prn,
      name,
      Gender: gender,
      email,
      password : await hashString(password), // Hash the password before saving
      Department: department,
      Year: year,
      type,
      College_name: college_name || "Sakec", // Default to Sakec if not provided
    });
    
    // Save user first to get the _id
    const savedUser = await newUser.save();
    console.log("New user created:", savedUser); // Debug log

    // Generate QR code for the user profile
    try {
      const qrResult = await generateUserQR(
        savedUser._id.toString(),
        savedUser.student_prn,
        savedUser.name
      );
      
      // Update user with QR code data
      savedUser.qrCode = {
        url: qrResult.qrCodeUrl,
        publicId: qrResult.qrCodePublicId,
        generatedAt: new Date(),
        data: qrResult.qrData
      };
      
      await savedUser.save();
      console.log("QR code generated and saved for user:", savedUser._id);
    } catch (qrError) {
      console.error("Failed to generate QR code:", qrError);
      // Continue with user creation even if QR generation fails
    }

    // Generate OTP and valid for 15 minutes
    const otp = Math.floor(100000 + Math.random() * 900000);
    try {
      await sendOTP(email, otp.toString());
      console.log(`OTP sent to ${email}: ${otp}`);
      // Save OTP to user record
      savedUser.OTP = otp;
      savedUser.OTPExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes from now
      await savedUser.save();
    } catch (err) {
      console.error("Failed to send OTP email:", err);
      // Optionally, you can delete the user if OTP fails to send
      await User.findByIdAndDelete(savedUser._id);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
        code: "OTP_SEND_FAILED",
      });
    }

    // Prepare user data to send (exclude sensitive information)
    const userData = sanitizeUserData(savedUser);

    // Respond with success
    res.status(201).json({
      success: true,
      message: "User registered successfully. Please check your email for verification code.",
      data: {
        user: userData,
        requiresVerification: true
      }
    });
  } catch (error) {
    console.error("Signup error:", error); // Debug log
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};
