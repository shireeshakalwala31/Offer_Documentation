const Appraisal = require("../models/AppraisalLetter");
const path = require("path");
const fs = require("fs");
const generateAppraisalPDF = require("../utils/appraisalPdfGenerator");

// Validate and convert date string safely
const parseDate = (date, fieldName) => {
  if (!date) return null;

  const parsed = new Date(date);

  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date format for ${fieldName}`);
  }

  return parsed;
};



// Create a new appraisal Letter
exports.createAppraisalletter = async (req, res) => {
  try {
    const {
      employeeName,
      employeeId,
      dateOfJoining,
      newSalary,
      salaryInWords,
      promotedRole,
      issueDate
    } = req.body;

    if (
      !employeeName ||
      !employeeId ||
      !dateOfJoining ||
      !newSalary ||
      !salaryInWords ||
      !promotedRole
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingAppraisal = await Appraisal.findOne({ employeeId });

    if (existingAppraisal) {
      return res.status(400).json({
        message: "This employee appraisal already exists."
      });
    }

    const newAppraisal = new Appraisal({
      employeeName,
      employeeId,
      dateOfJoining: parseDate(dateOfJoining, "dateOfJoining"),
      newSalary,
      salaryInWords,
      promotedRole,
      issueDate: parseDate(issueDate, "issueDate") || new Date()
    });

    await newAppraisal.save();

    res.status(201).json({
      message: "Appraisal Letter Created Successfully",
      data: {
        _id: newAppraisal._id,
        employeeName: newAppraisal.employeeName,
        employeeId: newAppraisal.employeeId
      }
    });

  } catch (error) {
    console.error("Error creating appraisal Letter:", error);
    res.status(500).json({
      message: error.message || "Internal Server Error"
    });
  }
};



// update an Appraisal Letter
exports.updateAppraisalLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employeeName,
      employeeId,
      dateOfJoining,
      newSalary,
      salaryInWords,
      promotedRole,
      issueDate
    } = req.body;

    if (
      !employeeName ||
      !employeeId ||
      !dateOfJoining ||
      !newSalary ||
      !salaryInWords ||
      !promotedRole ||
      !issueDate
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if another record already exists with same employeeId
    const existing = await Appraisal.findOne({
      employeeId,
      _id: { $ne: id }
    });

    if (existing) {
      return res.status(400).json({
        message: "Another appraisal already exists with this employee ID"
      });
    }

    const updated = await Appraisal.findByIdAndUpdate(
      id,
      {
        employeeName,
        employeeId,
        dateOfJoining: parseDate(dateOfJoining),
        newSalary,
        salaryInWords,
        promotedRole,
        issueDate: parseDate(issueDate)
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Appraisal Letter not found"
      });
    }

    return res.status(200).json({
      message: "Appraisal Letter updated successfully",
      data: updated
    });

  } catch (error) {
    console.error("Error updating appraisal Letter:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};


// delete an Appraisal Letter
exports.deleteAppraisalLetter=async(req,res)=>{
    try{
        const {id}=req.params;
        const deletedAppraisal=await Appraisal.findByIdAndDelete(id);
        if(!deletedAppraisal){
            return res.status(404).json({
                message:"Appraisal Letter not found"
            })
        }
        res.status(200).json({
            message:"Appraisal Letter deleted successfully"
        })

    }catch(error){
        console.log("Error Deleting appraisal letter:",error);
        res.status(500).json({
            message:"Internal Server Error",
            error:error.message
        })

    }
}
// getAppraisalLetter By Id
exports.getAppraisalLetterById=async(req,res)=>{
    try{
        const {id}=req.params;
        const appraisalLetter=await Appraisal.findById(id);
        if(!appraisalLetter){
            return res.status(404).json({
                message:"Appraisal Letter not found"
            })
        }
        res.status(200).json({
            message:"Appraisal Letter fetched Successfully",
            data:appraisalLetter
        })
    }catch(error){
        console.log("Error feching appraisal Letter by Id:",error);
        res.status(500).json({
            message:"Internal Server Error",
            error:error.message
        })
    }
}

exports.getAllAppraisalLetters = async (req, res) => {
  try {
    const appraisalLetters = await Appraisal.find()
      .select("employeeName employeeId")  // Return only required fields
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Apprasial Letters Fecthed Successfully",
      count: appraisalLetters.length,
      data: appraisalLetters
    });

  } catch (error) {
    console.log("Error fetching appraisal letters:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.downloadAppraisalLetter = async (req, res) => {
  try {
    const { id } = req.params;

    const letter = await Appraisal.findById(id);
    if (!letter) {
      return res.status(404).json({ message: "Appraisal Letter not found" });
    }

    const uploadsDir = path.resolve(__dirname, "../generated_pdfs");

    const safeName = letter.employeeName.replace(/\s+/g, "_");
    const companySafe = (letter.companyName || "Amazon IT Solutions")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");

    const fileName = `Appraisal_Letter_${safeName}_${companySafe}.pdf`;
    const pdfPath = path.join(uploadsDir, fileName);

    // If missing → regenerate
    if (!fs.existsSync(pdfPath)) {
      await generateAppraisalPDF(letter);
    }

    // Stream file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.on("error", () => {
      return res.status(500).json({ message: "Failed to read PDF file" });
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    fileStream.pipe(res);

  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};


exports.generatePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const appraisal = await Appraisal.findById(id);
    if (!appraisal) {
      return res.status(404).json({
        message: "Appraisal Letter not found"
      });
    }

    const pdfPath = await generateAppraisalPDF(appraisal);

    return res.status(200).json({
      message: "PDF generated successfully",
      filePath: pdfPath
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};