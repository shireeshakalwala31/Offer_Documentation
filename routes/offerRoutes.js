const express = require("express");
const router = express.Router();
const multer=require("multer")
const { registerAdmin, loginAdmin,forgotPassword,resetPasswordWithOtp } = require("../controllers/authController");
const {createOfferLetter,getAllOffers,getOfferById,updateOfferLetter,generatePDF,deleteOfferLetter,downloadOfferLetter,sendOfferLetterEmail}=require('../controllers/offerController');

const{verifyToken,adminOnly}=require('../middleware/authMiddleware');


// ✅ NO spaces after '/login'
router.get("/test", (req, res) => {
    res.status(200).send("Router is connected!");
});
// router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordWithOtp);
router.post("/create",verifyToken,adminOnly,createOfferLetter);
router.post('/generate-pdf',verifyToken,adminOnly,generatePDF)
router.get("/all",verifyToken,adminOnly,getAllOffers)
router.get('/:id',verifyToken,adminOnly,getOfferById);
router.put('/:id',verifyToken,adminOnly,updateOfferLetter)
router.delete('/:id',verifyToken,adminOnly,deleteOfferLetter);

router.get("/download/:id", verifyToken, adminOnly, downloadOfferLetter);
router.post("/send-email",verifyToken,adminOnly,sendOfferLetterEmail)


module.exports = router;
