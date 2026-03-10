const express = require("express");
const router = express.Router();
const {
  createInternshipOfferLetter,
  getAllInternshipOffers,
  getInternshipOfferById,
  updateInternshipOfferLetter,
  generateInternshipPDF,
  deleteInternshipOfferLetter,
  downloadInternshipOfferLetter,
  sendInternshipOfferLetterEmail,
  getDraftInternshipOffers,
} = require("../controllers/internshipOfferController");

const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

// Test endpoint
router.get("/test", (req, res) => {
  res.status(200).send("Internship Offer Router is connected!");
});

// Create internship offer
router.post("/create", verifyToken, adminOnly, createInternshipOfferLetter);

// Generate PDF
router.post("/generate-pdf", verifyToken, adminOnly, generateInternshipPDF);

// Get all internship offers
router.get("/all", verifyToken, adminOnly, getAllInternshipOffers);

// Get draft internship offers
router.get("/drafts", verifyToken, adminOnly, getDraftInternshipOffers);

// Get internship offer by ID
router.get("/:id", verifyToken, adminOnly, getInternshipOfferById);

// Update internship offer
router.put("/:id", verifyToken, adminOnly, updateInternshipOfferLetter);

// Delete internship offer
router.delete("/:id", verifyToken, adminOnly, deleteInternshipOfferLetter);

// Download internship offer letter
router.get("/download/:id", verifyToken, adminOnly, downloadInternshipOfferLetter);

// Send internship offer letter via email
router.post("/send-email", verifyToken, adminOnly, sendInternshipOfferLetterEmail);

module.exports = router;
