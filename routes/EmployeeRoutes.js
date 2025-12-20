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
  viewEmployeeByDraftId,
  deleteEmployeeByDraftId, // ✅ ADD
} = require("../controllers/employeeController");

const {
  verifyToken,
  adminOnly,
  employeeOnly,
} = require("../middleware/authMiddleware");

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

// Admin fills office use
router.post("/office", verifyToken, adminOnly, syncOfficeUseDetails);

// Admin fills office use from view/edit page
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

// View by draftId (ADMIN)
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

// ================= DELETE =================

// ✅ DELETE EMPLOYEE (ADMIN)
router.delete(
  "/employees/:draftId",
  verifyToken,
  adminOnly,
  deleteEmployeeByDraftId
);

module.exports = router;
