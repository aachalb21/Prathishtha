import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  // User details
  student_prn: { type: String, required: true, unique: true },
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  Gender:{
    type: String,
    required: true,
    enum: ["Male", "Female", "Other"],
  },
  Department: {
    type: String,
    required: true,
  },
  type:{
    type: String,
    required: true,
    enum: ["B.TECH", "B.VOC"],
  },
  Year: {
    type: String,
    required: true,
    enum: ["FY", "SY", "TY", "Final"],
  },
  
  College_name: {
    type: String,
    required: true,
    default: "Sakec",
  },
  Exp: { type: Number, default: 0 },
  eventsAttendedCount: { type: Number, default: 0 },

  // Authentication details
  password: {
    type: String,
    required: true,
  },
  OTP: {
    type: Number,
  },
  isVerified: { type: Boolean, default: false },
  OTPExpiresAt: { type: Date },
  // Password reset fields
  resetPasswordToken: { type: String },
  resetPasswordExpiresAt: { type: Date },
  loginAt: { type: Date, default: Date.now },
  CreatedAT: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },

  // Event registration details
  Events_registered: [
    {
      event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
      event_slug: { type: String },
      registration_date: { type: Date, default: Date.now },
      Payment_status: {
        type: String,
        enum: ["Pending", "Completed"],
        default: "Pending",
      },
      isParticipated: { type: Boolean, default: false },
      isWinner: { type: Boolean, default: false },
      // For team events: reference to Team and role in the team
      team_id: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
      team_role: { type: String, enum: ["leader", "member"], default: null },

    },
  ],

  // QR Code details
  qrCode: {
    url: { type: String }, // Cloudinary URL or data URL
    publicId: { type: String }, // Cloudinary public ID for deletion
    generatedAt: { type: Date, default: Date.now },
    data: {
      userId: { type: String },
      prn: { type: String },
      name: { type: String },
      type: { type: String, default: 'user_profile' },
      verificationUrl: { type: String }
    }
  },

  // Add other fields as necessary
});

const User = mongoose.model("User", UserSchema);

export default User;
