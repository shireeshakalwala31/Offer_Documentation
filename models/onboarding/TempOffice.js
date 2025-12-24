const mongoose = require("mongoose");

const officeSchema = new mongoose.Schema(
  {
    draftId: { type: String, required: true, index: true },

    /* ===== BASIC INFO ===== */
    companyName: { type: String, trim: true },
    location: { type: String, trim: true },

    employeeId: { type: String, trim: true },
    employeeName: { type: String, trim: true },

    dateOfJoining: { type: Date },
    previousExperience: { type: String },

    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    qualification: { type: String, trim: true },
    gradeLevel: { type: String, trim: true },

    /* ===== EMPLOYMENT TYPE ===== */
    employmentType: {
      type: String,
      enum: ["Permanent", "Probation", "Trainee", "Consultant", "Retainer"],
    },

    /* ===== SALARY ===== */
    grossPM: { type: Number },
    ctc: { type: Number },

    /* ===== REPORTING ===== */
    reportingOfficerId: { type: String },
    reportingOfficerName: { type: String },

    /* ===== SERVICE AGREEMENT ===== */
    bond: { type: Boolean, default: null },
    bondExemption: { type: Boolean, default: null },

    surety: { type: Boolean, default: null },
    suretyExemption: { type: Boolean, default: null },

    originalCertificates: { type: Boolean, default: null },
    certificateExemption: { type: Boolean, default: null },

    /* ===== SOURCE ===== */
    sourceOfRecruitment: {
      type: String,
      enum: ["Direct Placement", "Campus", "Referral", "Any Consultancy"],
    },

    /* ===== ASSETS ===== */
    assetTelRes: { type: Boolean, default: false },
    assetMobile: { type: Boolean, default: false },
    assetVehicle: { type: Boolean, default: false },
    assetFurniture: { type: Boolean, default: false },
    assetLaptop: { type: Boolean, default: false },
    assetDesktop: { type: Boolean, default: false },

    /* ===== FOOTER ===== */
    adminFilledDate: { type: Date },
    authorisedSignatory: { type: String },

    adminRemarks: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TempOffice", officeSchema);
