const fs=require('fs');
const path=require("path");
const RelievingLetter=require('../models/RelievingLetter');
const generateRelievingPDFUtil = require("../utils/relievingPdfGenerator")
const sendEmail=require('../services/emailService')
const logger = require('../logger/logger');

const mongoose=require('mongoose');
const Messages = require('../MsgConstants/messages');

// Helper: Strict date parser supporting DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, YYYY/MM/DD
const parseDate = (input) => {
  if (!input) return null;
  if (input instanceof Date && !isNaN(input)) return input;
  const s = String(input).trim();

  const ddmmyyyy = /^(\d{2})[-\/]?(\d{2})[-\/]?(\d{4})$/; // allow - or / separators
  const yyyymmdd = /^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})$/;

  let day, month, year;
  let m;
  if ((m = s.match(ddmmyyyy))) {
    day = parseInt(m[1], 10);
    month = parseInt(m[2], 10);
    year = parseInt(m[3], 10);
  } else if ((m = s.match(yyyymmdd))) {
    year = parseInt(m[1], 10);
    month = parseInt(m[2], 10);
    day = parseInt(m[3], 10);
  } else {
    return null;
  }

  // Construct UTC date to avoid timezone shifts
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null; // invalid like 31-02-2024
  }
  return d;
};


exports.createRelivingLetter=async(req,res)=>{
    try{
        const {employeeName,designation,employeeId,joiningDate,resignationDate,relievingDate}=req.body;

        if(!employeeName || !designation || !employeeId || !joiningDate || !resignationDate || !relievingDate){
            return res.status(400).json({message:Messages.RELIEVING_lETTER.MISSING_FIELDS_ERROR});
        }

        // Check if employeeId already exists
        const existingLetter = await RelievingLetter.findOne({ employeeId });
        if (existingLetter) {
            return res.status(400).json({ message:Messages.RELIEVING_lETTER.EMPLOYEE_ID_EXIST });
        }

        const jd = parseDate(joiningDate);
        const rzd = parseDate(resignationDate);
        const rld = parseDate(relievingDate);
        if (!jd || !rzd || !rld) {
            return res.status(400).json({ message: "Invalid date format. Use DD-MM-YYYY or YYYY-MM-DD" });
        }
        if (jd > rzd || rzd > rld) {
            return res.status(400).json({ message: "Date sequence invalid: joiningDate <= resignationDate <= relievingDate is required" });
        }

        const newRelievingLetter=new RelievingLetter({
            employeeName,
            designation,
            employeeId,
            joiningDate: jd,
            resignationDate: rzd,
            relievingDate: rld,

        });
        await newRelievingLetter.save();
        res.status(201).json({
            message:Messages.RELIEVING_lETTER.CREATE_SUCCESS,
      data: {
        _id: newRelievingLetter._id,
        employeeName: newRelievingLetter.employeeName
      }
        });

    }catch(error){
    logger.error("Error creating relieving letter:", error);
    res.status(500).json({ message: Messages.ERROR.SERVER, error: error.message });

    }

}
// Get All Relieving Letters

exports.getAllRelievingLetters=async(req,res)=>{
    try{
        const letters=await RelievingLetter.find().sort({createdAt:-1});
        if(!letters || letters.length==0){
            return res.status(404).json({message:Messages.RELIEVING_lETTER.NO_RELIEVING_LETTER});

        }
        const result=letters.map((letter)=>({
            _id:letter._id,
            employeeName:letter.employeeName,
            employeeId:letter.employeeId,
            designation:letter.designation,
        }));
        res.status(200).json(result);

    }catch(error){
        logger.error("Error fetching relieving letters:", error);
    res.status(500).json({
      message: Messages.ERROR.SERVER,
      error: error.message,
    });    

    }
}

// Get Relieving Letter By Id

exports.getRelievingLetterById=async(req,res)=>{
try{
    const {id}=req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message:Messages.RELIEVING_lETTER.INVLAID_OFFER_ID });
        }
        const letter=await RelievingLetter.findById(id);
        if(!letter){
            return res.status(404).json({message:Messages.RELIEVING_lETTER.NO_RELIEVING_LETTER});
        }
        res.status(200).json({
            _id:letter._id,
            employeeName:letter.employeeName,
            designation:letter.designation,
            employeeId:letter.employeeId,
            joiningDate:letter.joiningDate,
            resignationDate:letter.resignationDate,
            relievingDate:letter.relievingDate,
        });


}catch(error){
    logger.error("Error fetching relieving letter by ID:", error);
    res.status(500).json({
      message: Messages.ERROR.SERVER,
      error: error.message,
    });
}
}

// Upadate Relieving Letter

exports.updateRelievingLetter=async(req,res)=>{
    try{
        const {id}=req.params;
        if(!id){
            return res.status(400).json({message:Messages.RELIEVING_lETTER.RELIEVING_LETTER_ID});
        }
        const{employeeName,designation,employeeId,joiningDate,resignationDate,relievingDate}=req.body;

        let jd, rzd, rld;
        if (joiningDate !== undefined) {
            jd = parseDate(joiningDate);
            if (!jd) {
                return res.status(400).json({ message: "Invalid joiningDate format. Use DD-MM-YYYY or YYYY-MM-DD" });
            }
        }
        if (resignationDate !== undefined) {
            rzd = parseDate(resignationDate);
            if (!rzd) {
                return res.status(400).json({ message: "Invalid resignationDate format. Use DD-MM-YYYY or YYYY-MM-DD" });
            }
        }
        if (relievingDate !== undefined) {
            rld = parseDate(relievingDate);
            if (!rld) {
                return res.status(400).json({ message: "Invalid relievingDate format. Use DD-MM-YYYY or YYYY-MM-DD" });
            }
        }

        const updates={
            ...(employeeName &&{employeeName}),
            ...(designation &&{designation}),
            ...(employeeId &&{employeeId}),
            ...(jd && { joiningDate: jd }),
            ...(rzd && { resignationDate: rzd }),
            ...(rld && { relievingDate: rld }),
        };
        const updateLetter=await RelievingLetter.findByIdAndUpdate(id,updates,{
            new:true,
            runValidators:true,

        });
        if(!updateLetter){
            return res.status(404).json({message:Messages.RELIEVING_lETTER.RELIEVING_lETTER_NOT_FOUND});
        }
        res.status(200).json({
            message:Messages.RELIEVING_lETTER.UPDATE_SUCCESS,
            data: updateLetter,
        });

    }catch(error){
        logger.error("Error updating relieving letter:", error);
    res.status(500).json({
      message: Messages.ERROR.SERVER,
      error: error.message,
    });

    }
}

// Delete Relieving Letter

exports.deleteRelievingLetter=async(req,res) => {
    try{
        const {id}=req.params;

        if(!id){
            return res.status(400).json({message:Messages.RELIEVING_lETTER.RELIEVING_LETTER_ID});
        }
        const deleteLetter=await RelievingLetter.findByIdAndDelete(id);
        if(!deleteLetter){
            return res.status(404).json({message:Messages.RELIEVING_lETTER.RELIEVING_lETTER_NOT_FOUND})
        }
        res.status(200).json({
            message:Messages.RELIEVING_lETTER.DELETE_SUCCESS,
        })

    }catch(error){
        logger.error("Error deleting relieving letter:", error);
    return res.status(500).json({
      message: Messages.ERROR.SERVER,
      error: error.message,
    })
    }
}

// Generate Relieving PDF
exports.generateRelievingPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const letter = await RelievingLetter.findById(id);
    if (!letter) {
      return res.status(404).json({ message:Messages.RELIEVING_lETTER.RELIEVING_lETTER_NOT_FOUND });
    }

    const pdfPath = await generateRelievingPDFUtil(letter);

    res.status(200).json({
      message: Messages.RELIEVING_lETTER.GENERATE_PDF,
      pdfPath,
    });
  } catch (error) {
    res.status(500).json({
      message: Messages.ERROR.SERVER,
      error: error.message,
    });
  }
};



exports.downloadRelievingLetter = async (req, res) => {
  try {
    const { id } = req.params;

    
    const letter = await RelievingLetter.findById(id);
    if (!letter) {
      return res.status(404).json({ message: Messages.RELIEVING_lETTER.RELIEVING_lETTER_NOT_FOUND});
    }

    //Resolve stored PDF path (example field: pdfPath)
    let pdfPath = path.resolve(__dirname, "../generated_pdfs", `Relieving_${letter.employeeName.replace(/\s+/g, "_")}.pdf`);

    // Check if file exists, if not generate it
    if (!fs.existsSync(pdfPath)) {
      logger.info("PDF not found — generating now...");
      pdfPath = await generateRelievingPDFUtil(letter);
    }

    // Set response headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Relieving_${letter.employeeName.replace(/\s+/g, "_")}.pdf`);

    // Stream the file to client
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

    logger.info(`Downloaded: ${pdfPath}`);
  } catch (error) {
    logger.error("Error downloading PDF:", error);
    res.status(500).json({
      message: Messages.ERROR.SERVER,
      error: error.message,
    });
  }
};
//send relieving email with pdf Attachment

exports.sendRelievingEmail = async (req, res) => {
  try {
    const { relievingId, email } = req.body;

    // ✅ Validate required fields
    if (!relievingId || !email) {
      return res.status(400).json({ message: Messages.RELIEVING_lETTER.EMAIL_AND_RELIEVING_ID });
    }

    // ✅ Fetch relieving letter from DB
    const letter = await RelievingLetter.findById(relievingId);
    if (!letter) {
      return res.status(404).json({ message:Messages.RELIEVING_lETTER.RELIEVING_lETTER_NOT_FOUND });
    }

    // ✅ Construct PDF path
    const pdfPath = path.join(
      __dirname,
      `../generated_pdfs/Relieving_${letter.employeeName.replace(/\s+/g, "_")}.pdf`
    );

    // ✅ Check if PDF already exists — if not, generate it
    if (!fs.existsSync(pdfPath)) {
      logger.info("PDF not found — generating now...");
      await generateRelievingPDFUtil(letter);
    }

    logger.info("PDF Path:", pdfPath);
    logger.info("File Exists:", fs.existsSync(pdfPath));

    // ✅ Compose email
    const subject = `Relieving and Experience Letter - ${letter.employeeName} | Amazon IT Solutions`;
    const htmlBody = `
      <p>Dear ${letter.employeeName},</p>
      <p>
        Please find attached your <strong>Relieving and Experience Letter</strong> from 
        <strong>Amazon IT Solutions</strong>.
      </p>
      <p>We wish you the very best for your future endeavors!</p>
      <br />
      <p>Best regards,<br><strong>HR Department</strong><br>Amazon IT Solutions</p>
    `;

    // ✅ Send email with attachment
    await sendEmail({
      to: email,
      subject,
      html: htmlBody,
      text: `Dear ${letter.employeeName}, please find attached your relieving and experience letter.`,
      attachments: [
        {
          filename: `Relieving_${letter.employeeName}.pdf`,
          path: pdfPath,
          contentType: "application/pdf",
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: `Messages.RELIEVING_lETTER.RELIEVING_SENT ${email}`,
    });
  } catch (err) {
    logger.error("Error sending relieving letter email:", err);
    res.status(500).json({
      message: Messages.ERROR.SERVER,
      error: err.message,
    });
  }
};
