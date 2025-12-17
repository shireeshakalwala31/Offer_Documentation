const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    fileName: String,
    base64: String,
    mimeType: String,
    fileSize: Number,
    uploadedAt: Date
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    qualification: { type: String, required: true },
    subbranch: { type: String, required: false },
    percentage: String,
    university: String,
    yearPassing: { type: String, required: false },
    certificateAttachment: attachmentSchema
  },
  { _id: false }
);

const qualificationSchema = new mongoose.Schema(
  {
    draftId: { type: String, required: true, index: true },

    education: [educationSchema],                 // ARRAY OF EDUCATIONS
  },
  { timestamps: true }
);

module.exports = mongoose.model("Qualification", qualificationSchema);
