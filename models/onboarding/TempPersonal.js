const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { encryptText, decryptText } = require("../../utils/cryptoUtil");

const TempPersonalSchema = new mongoose.Schema({

  draftId: {
    type: String,
    unique: true,
    default: () => "DRAFT-" + uuidv4(),
    index: true
  },

  // Email ID
  email: {
    type: String,
    required: [true, "Email address is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },

  // Profile Photo URL
  photoUrl: {
    type: Object,
    default: null
  },

  // Personal Details
  firstName: {
    type: String,
    required: [true, "First Name is required"],
    trim: true,
    uppercase: true
  },
  lastName: {
    type: String,
    required: [true, "Last Name is required"],
    trim: true,
    uppercase: true
  },

  dateOfBirth: {
    type: Date,
    required: true
  },

  age: { type: Number, min: 18, max: 60 },

  placeOfBirth: { type: String, trim: true },
  state: { type: String, trim: true },
  district: { type: String, trim: true },

  nationality: {
    type: String,
    default: "Indian"
  },

  religion: { type: String, trim: true },

  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
    default: ""
  },

  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true
  },

  // Marital Status + Marriage Date
  maritalStatus: {
    type: String,
    enum: ["Single", "Married", "Separated", "Divorced", "Widowed"],
    default: "Single"
  },

  marriageDate: {
    type: Date,
    default: null,
    required: function () {
      return this.maritalStatus === "Married";
    }
  },

  // Contact Details - Present
  presentAddress: { type: String },
  presentCity: { type: String },
  presentState: { type: String },
  presentPhone: {
    type: String,
    match: [/^[+][9][1][6-9]\d{9}$|^[6-9]\d{9}$/, "Invalid phone number"]
  },
  presentPincode: {
    type: String,
    match: [/^\d{6}$/, "Invalid pincode"]
  },

  // Contact Details - Permanent
  permanentAddress: { type: String },
  permanentCity: { type: String },
  permanentState: { type: String },
  permanentPhone: {
    type: String,
    match: [/^[+][9][1][6-9]\d{9}$|^[6-9]\d{9}$/, "Invalid phone number"],
    default: ""
  },
  permanentPincode: {
    type: String,
    match: [/^\d{6}$/, "Invalid pincode"],
    default: ""
  },

  // ID Details (Encrypted Raw)
  drivingLicense: { type: mongoose.Schema.Types.Mixed, default: null },
  pan: { type: mongoose.Schema.Types.Mixed, default: null },
  aadhaar: { type: mongoose.Schema.Types.Mixed, default: null }

}, { timestamps: true });


// Auto-calculate Age from DOB
TempPersonalSchema.pre("save", function (next) {
  if (this.dateOfBirth) {
    const dob = new Date(this.dateOfBirth);
    const ageDiff = Date.now() - dob.getTime();
    this.age = Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
  }
  next();
});

// +91 Auto Normalization
TempPersonalSchema.pre("save", function (next) {
  if (this.presentPhone && !this.presentPhone.startsWith("+91")) {
    this.presentPhone = "+91" + this.presentPhone;
  }
  if (this.permanentPhone && !this.permanentPhone.startsWith("+91")) {
    this.permanentPhone = "+91" + this.permanentPhone;
  }
  next();
});

// Encrypt Aadhaar / PAN / DL
TempPersonalSchema.pre("save", function (next) {
  try {
    if (this.isModified("aadhaar") && this.aadhaar && typeof this.aadhaar === "string") {
      this.aadhaar = encryptText(this.aadhaar);
    }
    if (this.isModified("pan") && this.pan && typeof this.pan === "string") {
      this.pan = encryptText(this.pan);
    }
    if (this.isModified("drivingLicense") && this.drivingLicense && typeof this.drivingLicense === "string") {
      this.drivingLicense = encryptText(this.drivingLicense);
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("TempPersonal", TempPersonalSchema);
