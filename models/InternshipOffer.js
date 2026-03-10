const mongoose = require("mongoose");

// ====================== MAIN INTERNSHIP OFFER LETTER SCHEMA ======================
const InternshipOfferLetterSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: function() { return this.status !== "draft"; },
    trim: true,
    maxlength: 100,
  },
  candidateEmail: {
    type: String,
    trim: true,
  },
  candidatePhone: {
    type: String,
    trim: true,
  },
  candidateAddress: {
    type: String,
    trim: true,
  },
  // Internship Details
  position: {
    type: String,
    required: function() { return this.status !== "draft"; },
    trim: true,
  },
  internshipDuration: {
    type: String,
    default: "6 Months",
  },
  startDate: {
    type: Date,
    required: function() { return this.status !== "draft"; },
  },
  endDate: {
    type: Date,
  },
  workLocation: {
    type: String,
    default: "Work From Office",
    trim: true,
  },
  // Stipend Details
  firstPhaseStipend: {
    type: Number,
    default: 6000,
  },
  firstPhaseDuration: {
    type: String,
    default: "3 Months",
  },
  secondPhaseStipend: {
    type: Number,
    default: 10000,
  },
  secondPhaseDuration: {
    type: String,
    default: "3 Months",
  },
  // Stipend in words
  firstPhaseStipendInWords: {
    type: String,
    trim: true,
  },
  secondPhaseStipendInWords: {
    type: String,
    trim: true,
  },
  // Offer Metadata
  dateIssued: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["draft", "sent", "accepted", "rejected", "cancelled"],
    default: "draft",
  },
  pdfPath: {
    type: String,
    default: null,
  },
  formData: {
    type: Object,
    default: null
  },
  // Company Reference
  companyName: {
    type: String,
    default: "Amazon IT Solutions",
  },
  companyAddress: {
    type: String,
    default: "Hyderabad",
  },
  // Reference Number
  referenceNumber: {
    type: String,
    trim: true,
  },
  // Linked Admin (Creator)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HrAdmin",
    required: [true, "Internship offer must be created by an admin"],
  },
}, { timestamps: true });

// ====================== MODEL EXPORT ======================
const InternshipOfferLetter = mongoose.model("InternshipOfferLetter", InternshipOfferLetterSchema);
module.exports = InternshipOfferLetter;
