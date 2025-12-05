const  express=require("express");
const router=express.Router();
const {syncPersonalInfo,syncPFInfo,syncAcademicDetails, syncExperienceDetails,syncFamilyDetails,syncDeclarationDetails,syncOfficeUseDetails,mergeOnboarding,getEmployeeDetails,getAllEmployees}=require("../controllers/employeeController")
const {verifyToken,adminOnly}=require("../middleware/authMiddleware")

router.post('/personalInfo',verifyToken,syncPersonalInfo)
router.post('/pfInfo',verifyToken,syncPFInfo)
router.post('/academic',verifyToken, syncAcademicDetails)
router.post('/experience',verifyToken,syncExperienceDetails)
router.post("/family",verifyToken,syncFamilyDetails)
router.post('/declaration',verifyToken,syncDeclarationDetails)
router.post(
  "/office",
  verifyToken,
  adminOnly,syncOfficeUseDetails
);
router.post(
  "/submit",
  verifyToken,mergeOnboarding
);

router.get(
  "/employee/:employeeCode",
  verifyToken,
getEmployeeDetails
);
router.get(
  "/employees",
  verifyToken,
  getAllEmployees
);

module.exports=router
