// models/onboarding/TempOffice.js
const mongoose = require("mongoose");

const officeSchema = new mongoose.Schema(
  {
    draftId: { type: String, required: true, index: true },

    companyName: String,
    location: String,

    employeeId: String,
    employeeName: String,

    dateOfJoining: Date,
    previousExperience: String,

    department: String,
    designation: String,
    qualification: String,
    gradeLevel: String,

    employmentType: {
      type: String,
      enum: ["Permanent", "Probation", "Trainee", "Consultant", "Retainer"],
      default: null,
    },

    grossPM: Number,
    ctc: Number,

    reportingOfficerId: String,
    reportingOfficerName: String,

    bond: { type: Boolean, default: null },
    bondExemption: { type: Boolean, default: null },

    surety: { type: Boolean, default: null },
    suretyExemption: { type: Boolean, default: null },

    originalCertificates: { type: Boolean, default: null },
    certificateExemption: { type: Boolean, default: null },

    sourceOfRecruitment: {
      type: String,
      enum: ["Direct Placement", "Campus", "Referral", "Any Consultancy"],
      default: null,
    },

    assetTelRes: { type: Boolean, default: false },
    assetMobile: { type: Boolean, default: false },
    assetVehicle: { type: Boolean, default: false },
    assetFurniture: { type: Boolean, default: false },
    assetLaptop: { type: Boolean, default: false },
    assetDesktop: { type: Boolean, default: false },

    adminFilledDate: Date,
    authorisedSignatory: String,
    adminRemarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("TempOffice", officeSchema);
