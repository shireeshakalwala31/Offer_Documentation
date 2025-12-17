const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  fileName: String,
  base64: String,
  mimeType: String,
  fileSize: Number,
  uploadedAt: Date,
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  isExEmployee: String,
  companyName: String,
  joiningCTC: String,
  durationFrom: String,
  durationTo: String,
  offeredCTC: String,
  experienceRemarks: String,
  payslipAttachments: [attachmentSchema],
}, { _id: false });

const employmentSchema = new mongoose.Schema({
  draftId: { type: String, required: true, index: true },

  employmentType: { type: String, required: true }, // Fresher / Experience

  // Fresher Only
  fresherCtc: String,
  hiredRole: String,
  generalRemarks: String,

  // Experience Only
  experiences: [experienceSchema],

  // Fresher Offer Letter
  offerLetterAttachment: attachmentSchema,
}, { timestamps: true });

module.exports = mongoose.model("EmploymentDetails", employmentSchema);
