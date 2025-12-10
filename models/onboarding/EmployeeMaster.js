const mongoose = require("mongoose");

const employeeMasterSchema = new mongoose.Schema(
  {
    draftId: { type: String, required: true, unique: true },

    // Unique Employee Code after HR approval
    employeeCode: { type: String, unique: true },

    // Grouping like existing structure
    personal: Object,             // Personal Details
    pfDetails: Object,             // PF / UAN / Bank
    academicDetails: Array,        // Education history
    experienceDetails: Array,      // Work exp history
    familyDetails: Array,          // Family members
    declarationDetails: Object,    // Yes/No compliance + signatures
    officeUseDetails: Object,      // HR filled info (protected)

    // Tracking
    submittedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "submitted", "verified", "approved"],
      default: "draft"
    },

    // Who approved onboarding
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null
    },
    approvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployeeMaster", employeeMasterSchema);
