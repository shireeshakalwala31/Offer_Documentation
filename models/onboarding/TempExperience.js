const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
  draftId: { type: String, required: true },

  // For ordering experience entries
  serialNo: Number,

  // Employer Details
  employerName: String,
  employerAddress: String,

  // Employment duration
  fromDate: String,
  toDate: String,

  designation: String,
  salaryPA: String,
  industry: String,
  reasonForLeaving: String,

  // Professional Skills Section
  functionalSkills: String,
  technicalSkills: String,
  professionalAchievements: String,

  // Nominee Details (part of experience page)
  nomineeName: String,
  nomineeDob: String,
  nomineeRelationship: String,

  // Health Information
  height: String,
  weight: String,
  powerOfGlassLeft: String,
  powerOfGlassRight: String,
  majorSurgeryOrIllness: String,
  prolongedSickness: String,
  accidentHistory: String,
  foreignObjectInBody: String,

}, { timestamps: true });

module.exports = mongoose.model("TempExperience", experienceSchema);
