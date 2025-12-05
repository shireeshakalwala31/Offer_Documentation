const mongoose = require("mongoose");

const officeSchema = new mongoose.Schema({
  draftId: { type: String, required: true, unique: true },

  // Office Assigned Data
  officeCompanyName: String,
  employeeName: String,
  employeeId: String,
  location: String,
  joiningDate: String,

  // Job & Experience
  previousExperience: Number,
  department: String,
  designation: String,
  qualification: String,
  grade: String,

  // Salary
  salaryGrossPM: Number,
  salaryCTC: Number,

  // Employment Type
  employmentType: {
    type: String,
    enum: [
      "Permanent",
      "Probation",
      "Trainee",
      "Consultant",
      "RetainerShip"
    ]
  },

  // Reporting Manager
  reportingOfficerId: String,
  reportingOfficerName: String,

  // Service Agreement Section
  bond: { type: Boolean, default: null },
  surety: { type: Boolean, default: null },
  originalCertificates: { type: Boolean, default: null },

  bondExemption: { type: Boolean, default: null },
  certificateExemption: { type: Boolean, default: null },

  // Recruitment Source
  recruitmentSource: {
    type: String,
    enum: [
      "Direct Placement",
      "Campus",
      "Referral",
      "Any Consultancy"
    ]
  },

  // Company Assets Provided
  assetMobile: { type: Boolean, default: false },
  assetVehicle: { type: Boolean, default: false },
  assetLaptop: { type: Boolean, default: false },
  assetDesktop: { type: Boolean, default: false },
  assetFurniture: { type: Boolean, default: false },

  // Office Remarks & Signature
  adminRemarks: String,
  hrSignatureUrl: String,
  adminFilledDate: String

}, { timestamps: true });

module.exports = mongoose.model("TempOffice", officeSchema);
