const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { verifyToken } = require("../middleware/authMiddleware");

const {
  saveBasicInfo,
  saveQulification,
  saveOfferDetails,
  saveBankDetails,
  fetchDraft,
  finalSubmit,
  getCandidatesWithSearch,
  saveEmployeeDetails,
  getCandidateById,
  deleteCandidate,
  updateSection,
  uploadAnySectionFiles,
  downloadCandidatePDF,
  downloadSingleFile,
  viewCandidateDetails,
} = require("../controllers/onboardingController");

/* ===========================
   CREATE / UPDATE ROUTES
=========================== */

router.post(
  "/basic-info",
  upload.any(),
  verifyToken,
  saveBasicInfo
);

router.post(
  "/qualification",
  upload.any(),
  verifyToken,
  saveQulification
);

router.post(
  "/offer-details",
  upload.any(),
  verifyToken,
  saveOfferDetails
);

router.post(
  "/bank-details",
  upload.any(),
  verifyToken,
  saveBankDetails
);

router.post(
  "/employment-details",
  upload.any(),
  verifyToken,
  saveEmployeeDetails
);

router.post(
  "/update-section",
  upload.any(),
  verifyToken,
  updateSection
);

/* ===========================
   FETCH / SEARCH ROUTES
=========================== */

router.get(
  "/fetch-draft",
  verifyToken,
  fetchDraft
);

router.get(
  "/all/search",
  verifyToken,
  getCandidatesWithSearch
);

/* ===========================
   🔥 IMPORTANT: VIEW & FILE ROUTES
   (ORDER MATTERS – DO NOT CHANGE)
=========================== */

// ✅ View full candidate profile
router.get(
  "/view/:id",
  verifyToken,
  viewCandidateDetails
);

// ✅ Download full profile PDF
router.get(
  "/:id/pdf",
  verifyToken,
  downloadCandidatePDF
);

// ✅ Download single uploaded file
router.get(
  "/:id/:section/:fileName",
  downloadSingleFile
);

/* ===========================
   GENERIC ID ROUTES (ALWAYS LAST)
=========================== */

// ✅ Get candidate by ID
router.get(
  "/:id",
  verifyToken,
  getCandidateById
);

// ✅ Delete candidate
router.delete(
  "/:id",
  verifyToken,
  deleteCandidate
);

/* ===========================
   FINAL SUBMIT
=========================== */

router.post(
  "/final-submit",
  verifyToken,
  finalSubmit
);

module.exports = router;
