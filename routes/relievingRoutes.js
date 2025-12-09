const express=require("express");
const router=express.Router();
const { createRelivingLetter, getAllRelievingLetters, getRelievingLetterById, updateRelievingLetter, deleteRelievingLetter,generateRelievingPDF, downloadRelievingLetter, sendRelievingEmail }=require('../controllers/relievingController');
const{verifyToken,adminOnly}=require('../middleware/authMiddleware');
const { updateOne } = require("../models/Company");

router.post('/create',verifyToken,adminOnly,createRelivingLetter);
router.get('/all',verifyToken,adminOnly,getAllRelievingLetters);
router.get('/:id',verifyToken,adminOnly,getRelievingLetterById);
router.put('/:id',verifyToken,adminOnly,updateRelievingLetter);
router.delete('/:id',verifyToken,adminOnly,deleteRelievingLetter);
router.post('/generate-pdf/:id',verifyToken,adminOnly,generateRelievingPDF);
router.get('/download/:id',verifyToken,adminOnly,downloadRelievingLetter);
router.post("/send-email", verifyToken,adminOnly,sendRelievingEmail)
module.exports=router;