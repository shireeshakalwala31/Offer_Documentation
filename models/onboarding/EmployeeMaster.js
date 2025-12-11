const mongoose = require("mongoose");

const employeeMasterSchema = new mongoose.Schema(
  {
    draftId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // Onboarding Sections
    personal: { type: Object, default: {} },          
    pfDetails: { type: Object, default: {} },          
    academicDetails: { type: Array, default: [] },     
    experienceDetails: { type: Array, default: [] },   
    familyDetails: { type: Array, default: [] },       
    declarationDetails: { type: Object, default: {} }, 
    officeUseDetails: { type: Object, default: {} },   

    // Status Tracking
    status: {
      type: String,
      enum: ["draft", "submitted", "verified", "approved"],
      default: "draft"
    },

    // When employee submits
    submittedAt: { type: Date, default: null },

    // Admin verification / approval
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HrAdmin",
      default: null
    },
    approvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployeeMaster", employeeMasterSchema);
