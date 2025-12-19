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
  viewEmployeeByDraftId
} = require("../controllers/employeeController");

const { verifyToken, adminOnly, employeeOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// ================= AUTH =================
router.post("/register", registerEmployee);
router.post("/login", loginEmployee);

// ================= ONBOARDING =================

// STEP 1
router.post(
  "/personalInfo",
  verifyToken,
  employeeOnly,
  upload.single("photo"),
  syncPersonalInfo
);

// STEP 2
router.post("/pfInfo", verifyToken, employeeOnly, syncPFInfo);

// STEP 3
router.post(
  "/academic",
  verifyToken,
  employeeOnly,
  upload.array("certificates", 10),
  syncAcademicDetails
);

// STEP 4
router.post("/experience", verifyToken, employeeOnly, syncExperienceDetails);

// STEP 5
router.post("/family", verifyToken, employeeOnly, syncFamilyDetails);

// STEP 6
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

// OLD (keep)
router.post("/office", verifyToken, adminOnly, syncOfficeUseDetails);

// ✅ NEW (used by View page)
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

// All employees
router.get("/employees", verifyToken, adminOnly, getAllEmployees);

// ✅ View by draftId (SUPPORT BOTH)
router.get(
  "/employees/:draftId",
  verifyToken,
  adminOnly,
  viewEmployeeByDraftId
);

// ✅ Alias route (optional but SAFE)
router.get(
  "/employees/view/:draftId",
  verifyToken,
  adminOnly,
  viewEmployeeByDraftId
);

// Download PDF
router.get(
  "/employees/:draftId/pdf",
  verifyToken,
  adminOnly,
  downloadEmployeePDF
);

module.exports = router;
