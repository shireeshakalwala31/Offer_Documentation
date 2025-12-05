const mongoose = require("mongoose");

const declarationSchema = new mongoose.Schema(
  {
    draftId: { type: String, required: true, index: true },

    keepOriginalCertificates: { type: Boolean, default: null },
    willingServiceAgreement: { type: Boolean, default: null },
    willingToWorkAnywhere: { type: Boolean, default: null },
    agreeCompanyTerms: { type: Boolean, default: null },
    doYouSmoke: { type: Boolean, default: null },
    areYouAlcoholic: { type: Boolean, default: null },
    medicallyFit: { type: Boolean, default: null },

    convictedInCourt: { type: Boolean, default: null },
    convictedRemarks: { type: String, trim: true, default: "" },

    haveProfessionalMembership: { type: Boolean, default: null },
    membershipDetails: { type: String, trim: true, default: "" },

    specimenSignature1Url: { type: String, trim: true },
    specimenSignature2Url: { type: String, trim: true },

    declarationName: { type: String, trim: true },
    declarationSignatureUrl: { type: String, trim: true },
    declarationDate: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TempDeclaration", declarationSchema);
