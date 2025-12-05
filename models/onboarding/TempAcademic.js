const mongoose = require("mongoose");

const academicSchema = new mongoose.Schema({
  draftId: { 
    type: String, 
    required: true 
  },

  // New Field: Serial no. for ordering
  serialNo: {
    type: Number,
    required: false
  },

  qualification: {
    type: String,
    required: true
  },

  Specialization: String,

  schoolOrCollege: {
    type: String,
    required: true
  },

  boardOrUniversity: {
    type: String,
    required: true
  },

  marks: String,     // % or CGPA depending on entry

  // Full-time / Part-time / Distance
  studyMode: {
    type: String,
    enum: ["Full-time", "Part-time", "Distance", ""],
    default: ""
  },

  passYear: {
    type: String,
    required: true
  },

  // Optional but useful (recommended)
  certificateNo: String,

  // For document uploads (certificate scan)
  documentUrl: String // store file path or cloud URL

}, { timestamps: true });

module.exports = mongoose.model("TempAcademic", academicSchema);
