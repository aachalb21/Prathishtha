import mongoose from "mongoose";

/**
 * AttendanceLog Schema - Stores attendance records when users participate in events
 * This allows tracking event history and enables multiple registrations for casual events
 */
const AttendanceLogSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  // Event reference
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true
  },

  // Snapshot of event data at the time of attendance (for historical records)
  eventSnapshot: {
    event_id: { type: String },
    event_name: { type: String },
    event_slug: { type: String },
    event_type: { type: String },
    event_catagory: { type: String },
    event_date: { type: Date },
    event_fee: { type: Number, default: 0 }
  },

  // Snapshot of user data at the time of attendance
  userSnapshot: {
    name: { type: String },
    student_prn: { type: String },
    email: { type: String },
    Department: { type: String },
    Year: { type: String },
    College_name: { type: String }
  },

  // Registration details (copied from Events_registered before removal)
  registrationDetails: {
    registration_date: { type: Date },
    Payment_status: { type: String },
    team_id: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    team_role: { type: String, enum: ["leader", "member"], default: null }
  },

  // Attendance metadata
  markedAt: { type: Date, default: Date.now },
  markedBy: { type: String }, // Admin/coordinator who marked the attendance
  
  // Winner status (can be updated later)
  isWinner: { type: Boolean, default: false },
  winnerPosition: { type: String, enum: ["1st", "2nd", "3rd", null], default: null }
});

// Compound index for efficient queries
AttendanceLogSchema.index({ user: 1, event: 1, markedAt: -1 });
AttendanceLogSchema.index({ event: 1, markedAt: -1 });

const AttendanceLog = mongoose.model("AttendanceLog", AttendanceLogSchema);

export default AttendanceLog;
