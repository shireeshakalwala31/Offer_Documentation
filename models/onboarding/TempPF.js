const mongoose = require("mongoose");
const { encryptText } = require("../../utils/cryptoUtil");

const pfSchema = new mongoose.Schema(
  {
    draftId: {
      type: String,
      required: true,
      index: true
    },

    pfAction: String,

    // Sensitive & should be encrypted
    uanNumber: { type: mongoose.Schema.Types.Mixed, default: null },
    existingPfNumber: { type: mongoose.Schema.Types.Mixed, default: null },

    // Highly sensitive banking details (ENCRYPTED)
    bankAccountNumber: { type: mongoose.Schema.Types.Mixed, default: null },
    bankName: { type: String },

    ifscCode: {
      type: String,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC Code"]
    },

    // Passport information (ENCRYPTED)
    passportNumber: { type: mongoose.Schema.Types.Mixed, default: null },
    passportValidity: String,
    placeOfIssue: String,

    // Other fields (not sensitive)
    languages: [String],
    motherTongue: String,
    idMark1: String,
    idMark2: String,

    mobileNumber: {
      type: String,
      match: [/^[6-9]\d{9}$/, "Invalid phone number"]
    },

    email: {
      type: String,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"]
    }
  },
  { timestamps: true }
);


// Encrypt sensitive fields before saving
pfSchema.pre("save", function (next) {
  try {
    if (this.isModified("uanNumber") && this.uanNumber && typeof this.uanNumber === "string") {
      this.uanNumber = encryptText(this.uanNumber);
    }
    if (this.isModified("existingPfNumber") && this.existingPfNumber && typeof this.existingPfNumber === "string") {
      this.existingPfNumber = encryptText(this.existingPfNumber);
    }
    if (this.isModified("bankAccountNumber") && this.bankAccountNumber && typeof this.bankAccountNumber === "string") {
      this.bankAccountNumber = encryptText(this.bankAccountNumber);
    }
    if (this.isModified("passportNumber") && this.passportNumber && typeof this.passportNumber === "string") {
      this.passportNumber = encryptText(this.passportNumber);
    }
    next();
  } catch (error) {
    next(error);
  }
});


module.exports = mongoose.model("TempPF", pfSchema);
