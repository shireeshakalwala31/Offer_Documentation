const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const TempPersonalSchema = new mongoose.Schema({

  draftId: {
    type: String,
    unique: true,
    default: () => "DRAFT-" + uuidv4(),
    index: true
  },

  // Profile Photo URL/Path
  photoUrl: {
    type: String,
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

  maritalStatus: {
    type: String,
    enum: ["Single", "Married", "Separated", "Divorced", "Widowed"],
    default: "Single"
  },

  // Contact Details - Present
  presentAddress: { type: String },
  presentCity: { type: String },
  presentState: { type: String },
  presentPhone: {
    type: String,
    match: [/^[6-9]\d{9}$/, "Invalid phone number format"]
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
    match: [/^[6-9]\d{9}$/, "Invalid phone number format"],
    default: ""
  },
  permanentPincode: {
    type: String,
    match: [/^\d{6}$/, "Invalid pincode"],
    default: ""
  },

  // ID Details
  drivingLicense: { type: String },
  pan: {
    type: String,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number"]
  },
  aadhaar: {
    type: String,
    match: [/^\d{12}$/, "Aadhaar must be 12 digits"]
  }

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

// Normalize Indian phone numbers +91 format
TempPersonalSchema.pre("save", function (next) {
  if (this.presentPhone && this.presentPhone.length === 10) {
    this.presentPhone = "+91" + this.presentPhone;
  }
  if (this.permanentPhone && this.permanentPhone.length === 10) {
    this.permanentPhone = "+91" + this.permanentPhone;
  }
  next();
});

module.exports = mongoose.model("TempPersonal", TempPersonalSchema);
