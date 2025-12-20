const EmployeeMaster = require("../models/onboarding/EmployeeMaster");
const TempPersonal = require("../models/onboarding/TempPersonal");
const TempPF = require("../models/onboarding/TempPF");
const TempAcademic = require("../models/onboarding/TempAcademic");
const TempExperience = require("../models/onboarding/TempExperience");
const TempFamily = require("../models/onboarding/TempFamily");
const TempDeclaration = require("../models/onboarding/TempDeclaration");
const TempOffice = require("../models/onboarding/TempOffice");


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


// ===============================
// DELETE EMPLOYEE BY DRAFT ID (ADMIN)
// ===============================
exports.deleteEmployeeByDraftId = async (req, res) => {
  try {
    const { draftId } = req.params;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required",
      });
    }

    // Delete master record
    const deletedEmployee = await EmployeeMaster.findOneAndDelete({ draftId });

    if (!deletedEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Cleanup all temp onboarding collections
    await Promise.all([
      TempPersonal.deleteOne({ draftId }),
      TempPF.deleteOne({ draftId }),
      TempAcademic.deleteMany({ draftId }),
      TempExperience.deleteMany({ draftId }),
      TempFamily.deleteMany({ draftId }),
      TempDeclaration.deleteOne({ draftId }),
      TempOffice.deleteOne({ draftId }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete Employee Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete employee",
      error: error.message,
    });
  }
};
