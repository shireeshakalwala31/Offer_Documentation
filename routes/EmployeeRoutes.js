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
  getAllEmployees,
  registerEmployee,
  loginEmployee,
  downloadEmployeePDF,
  viewEmployeeByDraftId // ✅ ADD THIS
} = require("../controllers/employeeController");

const { verifyToken, adminOnly, employeeOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// ================= AUTH =================
router.post("/register", registerEmployee);
router.post("/login", loginEmployee);

// ================= ONBOARDING =================

// STEP 1: Personal Info
router.post(
  "/personalInfo",
  verifyToken,
  employeeOnly,
  upload.single("photo"),
  syncPersonalInfo
);

// STEP 2: PF
router.post("/pfInfo", verifyToken, employeeOnly, syncPFInfo);

// STEP 3: Academic
router.post(
  "/academic",
  verifyToken,
  employeeOnly,
  upload.array("certificates", 10),
  syncAcademicDetails
);

// STEP 4: Experience
router.post("/experience", verifyToken, employeeOnly, syncExperienceDetails);

// STEP 5: Family
router.post("/family", verifyToken, employeeOnly, syncFamilyDetails);

// STEP 6: Declaration
router.post(
  "/declaration",
  verifyToken,
  employeeOnly,
  upload.fields([
    { name: "specimenSignature1", maxCount: 1 },
    { name: "specimenSignature2", maxCount: 1 },
    { name: "declarationSignature", maxCount: 1 },
  ]),
  syncDeclarationDetails
);

// ================= OFFICE USE =================

// ADMIN fills office use
router.post(
  "/office",
  verifyToken,
  adminOnly,
  syncOfficeUseDetails
);

// ADMIN fills office use from view page
router.post(
  "/employees/:draftId/office",
  verifyToken,
  adminOnly,
  syncOfficeUseDetails
);

// ================= FINAL SUBMIT =================
router.post("/submit", verifyToken, employeeOnly, mergeOnboarding);

// ================= FETCH =================

// Logged-in employee
router.get("/employee", verifyToken, getEmployeeDetails);

// All employees (ADMIN)
router.get("/employees", verifyToken, adminOnly, getAllEmployees);

// View one employee by draftId (ADMIN)
router.get(
  "/employees/:draftId",
  verifyToken,
  adminOnly,
  viewEmployeeByDraftId
);

// Download PDF (ADMIN)
router.get(
  "/employees/:draftId/pdf",
  verifyToken,
  adminOnly,
  downloadEmployeePDF
);

module.exports = router;
