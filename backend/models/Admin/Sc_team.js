import mongoose from "mongoose";

const ScTeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
    },
    socialLinks: [
      {
        platform: {
          type: String,
          enum: ["instagram", "linkedin"],
          required: true,
        },
        url: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    profileImage: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ScTeam = mongoose.model("ScTeam", ScTeamSchema);

export default ScTeam;
