const express=require("express");
const router=express.Router()
const {verifyToken}=require('../middleware/authMiddleware');
const {createAppraisalletter, updateAppraisalLetter, deleteAppraisalLetter,getAppraisalLetterById,getAllAppraisalLetters,generatePDF,downloadAppraisalLetter}=require('../controllers/appraisalController')

router.post("/create", verifyToken,createAppraisalletter);
router.put('/update/:id',verifyToken,updateAppraisalLetter)
router.delete('/:id',verifyToken,deleteAppraisalLetter)
router.get("/all", verifyToken,getAllAppraisalLetters);
router.get("/:id", verifyToken, getAppraisalLetterById);
router.post("/generate-pdf/:id", verifyToken,generatePDF);
router.get("/download/:fileName", verifyToken, downloadAppraisalLetter);




module.exports = router;