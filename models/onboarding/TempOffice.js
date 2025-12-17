const mongoose = require("mongoose");

const officeSchema = new mongoose.Schema(
  {
    draftId: { type: String, required: true, index: true },

    officeCompanyName: { type: String, trim: true },
    employeeName: { type: String, trim: true, uppercase: true },
    employeeId: { type: String, trim: true, uppercase: true },

    location: { type: String, trim: true },
    joiningDate: { type: Date },

    previousExperience: { type: Number, min: 0 },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    qualification: { type: String, trim: true },
    grade: { type: String, trim: true },

    salaryGrossPM: { type: Number, min: 0 },
    salaryCTC: { type: Number, min: 0 },

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

    reportingOfficerId: { type: String, trim: true },
    reportingOfficerName: { type: String, trim: true },

    bond: { type: Boolean, default: null },
    surety: { type: Boolean, default: null },
    originalCertificates: { type: Boolean, default: null },

    bondExemption: { type: Boolean, default: null },
    certificateExemption: { type: Boolean, default: null },

    recruitmentSource: {
      type: String,
      enum: [
        "Direct Placement",
        "Campus",
        "Referral",
        "Any Consultancy"
      ]
    },

    assetMobile: { type: Boolean, default: false },
    assetVehicle: { type: Boolean, default: false },
    assetLaptop: { type: Boolean, default: false },
    assetDesktop: { type: Boolean, default: false },
    assetFurniture: { type: Boolean, default: false },

    adminRemarks: { type: String, trim: true },
    hrSignatureUrl: { type: String, trim: true },
    adminFilledDate: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TempOffice", officeSchema);
