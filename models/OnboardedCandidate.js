const mongoose = require("mongoose");

const onboardSchema = new mongoose.Schema(
  {
    draftId: { type: String, required: true, index: true },

    basicInfo: Object,
    qualification: Object,
    offerDetails: Object,
    bankDetails: Object,
    employmentDetails: Object,

    submittedAt: { type: Date, default: null },
    status: { 
      type: String, 
      enum: ["draft", "submitted"], 
      default: "draft"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("OnboardedCandidate", onboardSchema);
