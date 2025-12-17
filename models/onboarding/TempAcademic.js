const mongoose = require("mongoose");

const academicSchema = new mongoose.Schema({
  draftId: { type: String, required: true },

  serialNo: { type: Number },

  qualification: { type: String, required: true },

  Specialization: { type: String, default: "" },

  schoolOrCollege: { type: String, required: true },

  boardOrUniversity: { type: String, required: true },

  marks: { type: String, default: "" },

  studyMode: {
    type: String,
    enum: ["Full-time", "Part-time", "Distance", ""],
    default: "",
  },

  passYear: { type: String, required: true },

  certificateNo: { type: String, default: "" },

  // Document Object (Base64 OR URL)
  document: {
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    base64: { type: String, default: "" },
    url: { type: String, default: "" },
    uploadedAt: { type: Date },
  }

}, { timestamps: true });

module.exports = mongoose.model("TempAcademic", academicSchema);
