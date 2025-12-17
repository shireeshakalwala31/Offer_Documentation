const express=require("express");
const router=express.Router();
const {createAppointmentLetter, updateAppointmentLetter, deleteAppointmentLetter, getAllAppointmentLetters, getAppointmentLetterById, generateAppointmentPDF, downloadAppointmentPDF}=require('../controllers/appointmentController');
const{verifyToken,adminOnly}=require('../middleware/authMiddleware');

router.post('/create',verifyToken,adminOnly,createAppointmentLetter);
router.put('/:id',verifyToken,adminOnly,updateAppointmentLetter)
router.delete('/:id',verifyToken,adminOnly,deleteAppointmentLetter)
router.get('/all',verifyToken,adminOnly,getAllAppointmentLetters);
router.get('/:id',verifyToken,adminOnly,getAppointmentLetterById);
router.post('/generate-pdf',verifyToken,adminOnly,generateAppointmentPDF);
router.get('/download/:id',verifyToken,adminOnly,downloadAppointmentPDF)
module.exports=router;