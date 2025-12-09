const express = require("express");
const router = express.Router();

const {
  syncPersonalInfo,
  syncPFInfo,
  syncAcademicDetails,
  syncExperienceDetails,
  syncFamilyDetails,
  syncDeclarationDetails,
  syncOfficeUseDetails,
  mergeOnboarding,
  getEmployeeDetails,
  getAllEmployees
} = require("../controllers/employeeController");

const { verifyToken, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // <-- ADD THIS

// STEP 1: Personal Info (Profile Photo Upload)
router.post(
  "/personalInfo",
  verifyToken,
  upload.single("photo"),  // <-- CRITICAL FIX
  syncPersonalInfo
);

// STEP 2: PF Details
router.post("/pfInfo", verifyToken, syncPFInfo);

// STEP 3: Academic (multiple attachments)
router.post(
  "/academic",
  verifyToken,
  upload.array("certificates", 10), // <-- supports multiple certificates
  syncAcademicDetails
);

// STEP 4: Experience
router.post("/experience", verifyToken, syncExperienceDetails);

// STEP 5: Family
router.post("/family", verifyToken, syncFamilyDetails);

// STEP 6: Declaration (Signatures)
router.post(
  "/declaration",
  verifyToken,
  upload.fields([
    { name: "specimenSignature1", maxCount: 1 },
    { name: "specimenSignature2", maxCount: 1 },
    { name: "declarationSignature", maxCount: 1 },
  ]), // <-- required for signature uploads
  syncDeclarationDetails
);

// Office Use (Admin Only)
router.post(
  "/office",
  verifyToken,
  adminOnly,
  syncOfficeUseDetails
);

// FINAL SUBMISSION
router.post("/submit", verifyToken, adminOnly, mergeOnboarding);

// Fetch One Employee
router.get("/employee/:employeeCode", verifyToken, getEmployeeDetails);

// Fetch All Employees
router.get("/employees", verifyToken, adminOnly, getAllEmployees);

module.exports = router;
