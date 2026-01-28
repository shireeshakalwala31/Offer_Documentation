const mongoose = require("mongoose");

const onboardingProgressSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    draftId: {
      type: String,
      required: true,
      index: true
    },

    email: {
      type: String,
      required: true
    },

    firstName: {
      type: String,
      required: true,
      trim: true
    },

    lastName: {
      type: String,
      required: true,
      trim: true
    },

    // Section completion tracking
    personal: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null }
    },

    pf: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null }
    },

    academic: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null }
    },

    experience: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null }
    },

    family: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null }
    },

    declaration: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null }
    },

    // Overall completion status
    isFullyCompleted: {
      type: Boolean,
      default: false
    },

    completedAt: {
      type: Date,
      default: null
    },

    // Current section being filled (for UI navigation)
    currentSection: {
      type: String,
      enum: ["personal", "pf", "academic", "experience", "family", "declaration"],
      default: "personal"
    }
  },
  { timestamps: true }
);

// Method to check if all sections are completed
onboardingProgressSchema.methods.checkFullCompletion = function() {
  return (
    this.personal.completed &&
    this.pf.completed &&
    this.academic.completed &&
    this.experience.completed &&
    this.family.completed &&
    this.declaration.completed
  );
};

// Method to get next incomplete section
onboardingProgressSchema.methods.getNextSection = function() {
  if (!this.personal.completed) return "personal";
  if (!this.pf.completed) return "pf";
  if (!this.academic.completed) return "academic";
  if (!this.experience.completed) return "experience";
  if (!this.family.completed) return "family";
  if (!this.declaration.completed) return "declaration";
  return null; // All completed
};

// Method to get completion percentage
onboardingProgressSchema.methods.getCompletionPercentage = function() {
  const sections = [
    this.personal.completed,
    this.pf.completed,
    this.academic.completed,
    this.experience.completed,
    this.family.completed,
    this.declaration.completed
  ];
  
  const completedCount = sections.filter(Boolean).length;
  return Math.round((completedCount / 6) * 100);
};

module.exports = mongoose.model("OnboardingProgress", onboardingProgressSchema);
