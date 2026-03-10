const InternshipOfferLetter = require("../models/InternshipOffer");
const generateInternshipPDF = require("../utils/internshipPdfGenerator");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const sendEmail = require("../services/emailService");
const logger = require("../logger/logger");
const Messages = require("../MsgConstants/messages");
const jwt = require("jsonwebtoken");

//
// ======================== CREATE INTERNSHIP OFFER ========================
//
exports.createInternshipOfferLetter = async (req, res) => {
  try {
    if (!req.admin || !req.admin._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Admin credentials missing",
      });
    }

    const { status, formData } = req.body;
    const isDraft = status === "draft";

    // ✅ DRAFT: save raw form exactly as sent
    if (isDraft) {
      const draft = new InternshipOfferLetter({
        status: "draft",
        formData,
        createdBy: req.admin._id,
      });

      await draft.save();

      return res.status(201).json({
        success: true,
        message: "Draft saved successfully",
        data: draft,
      });
    }

    // ================= FINAL INTERNSHIP OFFER =================

    const {
      candidateName,
      candidateEmail,
      candidatePhone,
      candidateAddress,
      position,
      internshipDuration,
      startDate,
      endDate,
      workLocation,
      firstPhaseStipend,
      firstPhaseDuration,
      secondPhaseStipend,
      secondPhaseDuration,
      firstPhaseStipendInWords,
      secondPhaseStipendInWords,
      companyName,
      companyAddress,
      referenceNumber,
    } = req.body;

    // ✅ STRICT VALIDATION (FINAL ONLY)
    if (
      !candidateName ||
      !position ||
      !startDate
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const pdfPath = await generateInternshipPDF({
      candidateName,
      candidateEmail,
      candidatePhone,
      candidateAddress,
      position,
      internshipDuration: internshipDuration || "6 Months",
      startDate,
      endDate,
      workLocation: workLocation || "Work From Office",
      firstPhaseStipend: firstPhaseStipend || 6000,
      firstPhaseDuration: firstPhaseDuration || "3 Months",
      secondPhaseStipend: secondPhaseStipend || 10000,
      secondPhaseDuration: secondPhaseDuration || "3 Months",
      firstPhaseStipendInWords: firstPhaseStipendInWords || "Six Thousand",
      secondPhaseStipendInWords: secondPhaseStipendInWords || "Ten Thousand",
      companyName: companyName || "Amazon IT Solutions",
      companyAddress: companyAddress || "Hyderabad",
      referenceNumber: referenceNumber || "AIS/HR-INT/2026/01",
    });

    const internshipOffer = new InternshipOfferLetter({
      candidateName,
      candidateEmail,
      candidatePhone,
      candidateAddress,
      position,
      internshipDuration: internshipDuration || "6 Months",
      startDate,
      endDate,
      workLocation: workLocation || "Work From Office",
      firstPhaseStipend: firstPhaseStipend || 6000,
      firstPhaseDuration: firstPhaseDuration || "3 Months",
      secondPhaseStipend: secondPhaseStipend || 10000,
      secondPhaseDuration: secondPhaseDuration || "3 Months",
      firstPhaseStipendInWords,
      secondPhaseStipendInWords,
      companyName: companyName || "Amazon IT Solutions",
      companyAddress,
      referenceNumber: referenceNumber || "AIS/HR-INT/2026/01",
      status: "sent",
      pdfPath,
      createdBy: req.admin._id,
    });

    await internshipOffer.save();

    res.status(201).json({
      success: true,
      message: "Internship offer letter created successfully",
      data: internshipOffer,
    });
  } catch (error) {
    logger.error("Create Internship Offer Error:", error);
    res.status(500).json({
      success: false,
      message: Messages.ERROR.SERVER,
    });
  }
};

//
// ======================== UPDATE INTERNSHIP OFFER ========================
//
exports.updateInternshipOfferLetter = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedUpdates = [
      "candidateName",
      "candidateEmail",
      "candidatePhone",
      "candidateAddress",
      "position",
      "internshipDuration",
      "startDate",
      "endDate",
      "workLocation",
      "firstPhaseStipend",
      "firstPhaseDuration",
      "secondPhaseStipend",
      "secondPhaseDuration",
      "firstPhaseStipendInWords",
      "secondPhaseStipendInWords",
      "companyName",
      "companyAddress",
      "referenceNumber",
      "status",
    ];

    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const filter = {
      _id: id
    };

    const updatedOffer = await InternshipOfferLetter.findOneAndUpdate(filter, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedOffer) {
      const exists = await InternshipOfferLetter.exists({ _id: id });

      if (!exists) {
        return res.status(404).json({ success: false, message: "Internship offer not found" });
      } else {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    res.status(200).json({
      success: true,
      message: "Internship offer letter updated successfully",
      data: updatedOffer,
    });
  } catch (error) {
    logger.error("Error updating internship offer letter:", error);
    if (error.name === 'CastError' && error.path === '_id') {
      return res.status(400).json({ success: false, message: "Invalid Internship Offer ID format" });
    }
    res.status(500).json({
      success: false,
      message: Messages.ERROR.SERVER,
      error: error.message,
    });
  }
};

//
// ======================== DELETE INTERNSHIP OFFER ========================
//
exports.deleteInternshipOfferLetter = async (req, res) => {
  try {
    const { id } = req.params;

    const internshipOffer = await InternshipOfferLetter.findById(id);

    if (!internshipOffer) {
      return res.status(404).json({
        success: false,
        message: "Internship offer not found",
      });
    }

    await InternshipOfferLetter.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Internship offer letter deleted successfully",
      data: internshipOffer,
    });
  } catch (error) {
    logger.error("Error deleting internship offer letter:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid Internship Offer ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: Messages.ERROR.SERVER,
      error: error.message,
    });
  }
};

//
// ======================== GET ALL INTERNSHIP OFFERS ========================
//
exports.getAllInternshipOffers = async (req, res) => {
  try {
    const offers = await InternshipOfferLetter.find().sort({ createdAt: -1 });

    const totalCount = await InternshipOfferLetter.countDocuments();

    res.status(200).json({
      success: true,
      message: offers.length === 0 
        ? "No internship offer letters found" 
        : "Internship offers retrieved successfully",
      count: offers.length,
      totalCount,
      data: offers,
    });
  } catch (error) {
    logger.error("Error fetching internship offers:", error);
    res.status(500).json({ message: Messages.ERROR.SERVER });
  }
};

//
// ======================== GET DRAFT INTERNSHIP OFFERS ========================
//
exports.getDraftInternshipOffers = async (req, res) => {
  try {
    const offers = await InternshipOfferLetter.find({ status: "draft" }).sort({ createdAt: -1 });

    const totalCount = await InternshipOfferLetter.countDocuments({ status: "draft" });

    res.status(200).json({
      success: true,
      message: offers.length === 0 
        ? "No draft internship offer letters found" 
        : "Draft internship offers retrieved successfully",
      count: offers.length,
      totalCount,
      data: offers,
    });
  } catch (error) {
    logger.error("Error fetching draft internship offers:", error);
    res.status(500).json({ message: Messages.ERROR.SERVER });
  }
};

//
// ======================== GET INTERNSHIP OFFER BY ID ========================
//
exports.getInternshipOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Internship Offer ID format" });
    }

    const offer = await InternshipOfferLetter.findById(id).populate("createdBy", "firstName lastName email");

    if (!offer) {
      return res.status(404).json({ message: "Internship offer not found" });
    }

    const totalCount = await InternshipOfferLetter.countDocuments({});
    res.status(200).json({ success: true, data: offer, count: totalCount });
  } catch (err) {
    logger.error("Error fetching internship offer by ID:", err);
    res.status(500).json({ message: Messages.ERROR.SERVER, error: err.message });
  }
};

//
// ======================== DOWNLOAD INTERNSHIP OFFER LETTER ========================
//
exports.downloadInternshipOfferLetter = async (req, res) => {
  try {
    const offer = await InternshipOfferLetter.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        message: "Internship offer not found",
      });
    }

    if (offer.status === "draft") {
      return res.status(400).json({
        message: "Please complete all details before downloading the internship offer letter",
      });
    }

    let pdfPath = offer.pdfPath;

    if (!pdfPath || !fs.existsSync(pdfPath)) {
      pdfPath = await generateInternshipPDF(offer);
      offer.pdfPath = pdfPath;
      await offer.save();
    }

    return res.download(
      pdfPath,
      `InternshipOffer_${offer.candidateName}.pdf`
    );
  } catch (error) {
    logger.error("Download error:", error);
    res.status(500).json({ message: Messages.ERROR.SERVER });
  }
};

//
// ======================== SEND INTERNSHIP OFFER LETTER EMAIL ========================
//
exports.sendInternshipOfferLetterEmail = async (req, res) => {
  try {
    const { offerId, candidateEmail } = req.body;

    if (!offerId || !candidateEmail) {
      return res.status(400).json({ message: "Offer ID and candidateEmail is required" });
    }

    const offer = await InternshipOfferLetter.findById(offerId).populate("createdBy", "name email");

    if (!offer) {
      return res.status(404).json({ message: "Internship offer not found" });
    }

    const pdfPath = path.join(
      __dirname,
      `../uploads/InternshipOffer_${offer.candidateName.replace(/\s+/g, "_")}.pdf`
    );

    if (!fs.existsSync(pdfPath)) {
      logger.info("PDF not found — generating now...");
      await generateInternshipPDF(offer);
    }

    logger.info("PDF Path:", pdfPath);
    logger.info("File Exists:", fs.existsSync(pdfPath));

    const subject = `Internship Offer Letter - ${offer.candidateName} | Amazon IT Solutions`;
    const htmlBody = `
      <p>Dear ${offer.candidateName},</p>
      <p>We are pleased to offer you the position of <strong>${offer.position}</strong> Intern at <strong>Amazon IT Solutions</strong>.</p>
      <p>Please find attached your official internship offer letter.</p>
      <p>We look forward to having you on board!</p>
      <br />
      <p>Best regards,<br><strong>HR Department</strong><br>Amazon IT Solutions</p>
    `;

    await sendEmail({
      to: candidateEmail,
      subject,
      html: htmlBody,
      text: `Dear ${offer.candidateName}, please find attached your internship offer letter.`,
      attachments: [
        {
          filename: `InternshipOffer_${offer.candidateName}.pdf`,
          path: pdfPath,
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: `Internship offer letter sent successfully to ${candidateEmail}`,
    });
  } catch (err) {
    logger.error("Error sending internship offer letter email:", err);
    res.status(500).json({ message: Messages.ERROR.SERVER });
  }
};

//
// ======================== GENERATE PDF ========================
//
exports.generateInternshipPDF = async (req, res) => {
  try {
    logger.info("Incoming Internship PDF Generation Request:", req.body);

    const internshipData = req.body;
    const pdfPath = await generateInternshipPDF(internshipData);

    logger.info("Internship PDF generated at:", pdfPath);

    return res.status(200).json({
      success: true,
      message: "Internship Offer Letter PDF generated successfully",
      pdfPath,
    });
  } catch (error) {
    logger.error("Internship PDF Generation Failed:", error);
    res.status(500).json({
      message: Messages.ERROR.SERVER,
      error: error.message,
      stack: error.stack,
    });
  }
};
