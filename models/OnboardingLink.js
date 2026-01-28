const mongoose = require("mongoose");

const onboardingLinkSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    isExpired: {
      type: Boolean,
      default: false
    },

    // Optional: Auto-expire after certain days if not completed
    expiresAt: {
      type: Date,
      default: null
    },

    // Track who generated this link (HR admin)
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HrAdmin",
      default: null
    }
  },
  { timestamps: true }
);

// Index for faster lookups
onboardingLinkSchema.index({ token: 1, isExpired: 1 });

module.exports = mongoose.model("OnboardingLink", onboardingLinkSchema);
