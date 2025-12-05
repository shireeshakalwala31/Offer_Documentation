const mongoose = require("mongoose");

const declarationSchema = new mongoose.Schema({
  draftId: { type: String, required: true },

  // Boolean Yes/No Questions
  keepOriginalCertificates: { type: Boolean, default: null },
  willingServiceAgreement: { type: Boolean, default: null },
  willingToWorkAnywhere: { type: Boolean, default: null },
  agreeCompanyTerms: { type: Boolean, default: null },
  doYouSmoke: { type: Boolean, default: null },
  areYouAlcoholic: { type: Boolean, default: null },

  medicallyFit: { type: Boolean, default: null },

  convictedInCourt: { type: Boolean, default: null },
  convictedRemarks: { type: String, default: "" },

  haveProfessionalMembership: { type: Boolean, default: null },
  membershipDetails: { type: String, default: "" },

  // Signatures (Stored as file URL/path)
  specimenSignature1Url: String,
  specimenSignature2Url: String,

  // Final Declaration
  declarationName: String,
  declarationSignatureUrl: String,
  declarationDate: String

}, { timestamps: true });

module.exports = mongoose.model("TempDeclaration", declarationSchema);
