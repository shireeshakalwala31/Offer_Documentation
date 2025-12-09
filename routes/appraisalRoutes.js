const express=require("express");
const router=express.Router()
const {verifyToken,adminOnly}=require('../middleware/authMiddleware');
const {createAppraisalletter, updateAppraisalLetter, deleteAppraisalLetter,getAppraisalLetterById,getAllAppraisalLetters,generatePDF,downloadAppraisalLetter}=require('../controllers/appraisalController')

router.post("/create", verifyToken,adminOnly,createAppraisalletter);
router.put('/:id',verifyToken,adminOnly,updateAppraisalLetter)
router.delete('/:id',verifyToken,adminOnly,deleteAppraisalLetter)
router.get("/all", verifyToken,adminOnly,getAllAppraisalLetters);
router.get("/:id", verifyToken,adminOnly,getAppraisalLetterById);
router.post("/generate-pdf/:id", verifyToken,adminOnly,generatePDF);
router.get("/download/:id", verifyToken,adminOnly,downloadAppraisalLetter);




module.exports = router;