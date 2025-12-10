const EmployeeMaster = require("../models/onboarding/EmployeeMaster");
const TempPersonal = require("../models/onboarding/TempPersonal");
const TempPF=require("../models/onboarding/TempPF")
const TempAcademic=require("../models/onboarding/TempAcademic")
const TempExperience = require("../models/onboarding/TempExperience");
const TempFamily = require("../models/onboarding/TempFamily");
const TempDeclaration = require("../models/onboarding/TempDeclaration");
const TempOffice = require("../models/onboarding/TempOffice");
const { v4: uuidv4 } = require("uuid");

exports.syncPersonalInfo = async (req, res) => {
  try {
    console.log("----- Incoming Personal Info Request -----");
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Raw Body:", req.body);
    console.log("File:", req.file);

    // SAFELY PARSE BODY (Fix for FormData JSON)
    let parsedBody = {};

    try {
      parsedBody = typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;
    } catch (parseErr) {
      parsedBody = req.body;
    }

    console.log("PARSED BODY =>", parsedBody);

    // FIELD MAPPING SUPPORTING FRONTEND NAMES
    const payload = {
      ...parsedBody,
      dateOfBirth: parsedBody.dateOfBirth || parsedBody.dob,
      aadhaar: parsedBody.aadhaar || parsedBody.aadhar,
      permanentPhone: parsedBody.permanentPhone || parsedBody.permPhone,
    };

    const {
      draftId,
      firstName,
      lastName,
      gender,
      aadhaar,
      pan,
      presentPhone,
      permanentPhone,
      dateOfBirth,
      ...restFields
    } = payload;

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First & Last Name required"
      });
    }

    const generatedDraftId =
      draftId && draftId.trim() !== ""
        ? draftId
        : `DRAFT-${uuidv4()}`;

    // PHOTO CONVERSION (BASE64)
    let photo = undefined;
    if (req.file) {
      photo = {
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        base64: req.file.buffer.toString("base64"),
        uploadedAt: new Date(),
      };
    }

    // SAVE TEMP DATA
    let temp = await TempPersonal.findOne({ draftId: generatedDraftId });

    if (!temp) {
      temp = new TempPersonal({
        draftId: generatedDraftId,
        firstName,
        lastName,
        gender,
        aadhaar,
        pan,
        presentPhone,
        permanentPhone,
        dateOfBirth,
        ...restFields
      });
    } else {
      Object.assign(temp, payload);
    }

    if (photo) temp.photoUrl = photo;
    await temp.save();

    // SYNC INTO MASTER COLLECTION
    let master = await EmployeeMaster.findOne({ draftId: generatedDraftId });
    if (!master) master = new EmployeeMaster({ draftId: generatedDraftId });

    master.personal = temp.toObject();
    master.status = "draft";
    await master.save();

    return res.status(200).json({
      success: true,
      message: "Personal info saved & synced successfully",
      draftId: generatedDraftId,
      data: temp
    });

  } catch (error) {
    console.error("Personal Save Error =>", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Failed to save personal info",
      error: error.message
    });
  }
};



// step 2:PF Information Sync
exports.syncPFInfo=async(req,res)=>{
    try{
        const{draftId,
      pfAccountNumber,
      uanNumber,
      esicNumber,
      bankAccountNumber,
      bankName,
      ifscCode,
      passportNumber,
      passportExpiry,
      drivingLicenseNumber,
      drivingLicenseExpiry,
      languagesKnown,
      motherTongue,
      identificationMark1,
      identificationMark2}=req.body
      if(!draftId){
        return res.status(400).json({success:false,message:"Draft ID is Required"})
      }
      if (bankAccountNumber && !/^[0-9]{8,18}$/.test(bankAccountNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bank Account Number"
      });
    }
    if (ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid IFSC Code"
      });
    }
    if (uanNumber && !/^[0-9]{12}$/.test(uanNumber)) {
      return res.status(400).json({
        success: false,
        message: "UAN must be 12 digits"
      });
    }
    let temp=await TempPF.findOne({draftId});
    if(!temp){
       temp = new TempPF(req.body);
    }else{
        Object.assign(temp,req.body)
    }
    await temp.save()
    let master=await EmployeeMaster.findOne({draftId});
    if(!master){
        master=new EmployeeMaster({draftId})
    }
    master.pfDetails = temp.toObject();
    master.status = "draft";
    await master.save();
     return res.status(200).json({
      success: true,
      message: "PF Details saved & synced successfully",
      draftId,
      data: temp
    });
    }catch(err){
        console.error("PF Save Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save PF details",
      error: error.message
    });

    }
}
// Step 3: Academic Information Sync
exports.syncAcademicDetails = async (req, res) => {
  try {
    const { draftId } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required"
      });
    }

    let academicList = [];

    // Accept array directly or JSON string
    if (req.body.academics) {
      try {
        academicList = Array.isArray(req.body.academics)
          ? req.body.academics
          : JSON.parse(req.body.academics);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid academics format"
        });
      }
    }

    if (!academicList.length) {
      return res.status(400).json({
        success: false,
        message: "At least one Academic entry required"
      });
    }

    // Add draftId + validate
    academicList.forEach((row, i) => {
      if (!row.qualification?.trim()) {
        throw new Error(`Qualification missing at row ${i + 1}`);
      }

      if (!row.boardOrUniversity?.trim()) {
        throw new Error(`Board/University missing at row ${i + 1}`);
      }

      if (!row.passYear?.trim()) {
        throw new Error(`Pass Year missing at row ${i + 1}`);
      }

      row.draftId = draftId;
    });

    // Clear previous records
    await TempAcademic.deleteMany({ draftId });
    await TempAcademic.insertMany(academicList);

    // SYNC to Master document
    let master = await EmployeeMaster.findOne({ draftId });
    if (!master) master = new EmployeeMaster({ draftId });

    master.academicDetails = academicList;
    master.status = "draft";
    await master.save();

    return res.status(200).json({
      success: true,
      message: "Academic details saved & synced successfully",
      draftId,
      data: academicList
    });

    } catch (error) {
  console.error("Academic Save Error:", error.stack || error);
  return res.status(500).json({
    success: false,
    message: "Backend Failure",
    error: error.message
  });
}
  
};



// STEP-4: Experience Save + Sync
exports.syncExperienceDetails = async (req, res) => {
  try {
    const { draftId, experiences } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required"
      });
    }

    const experienceList = Array.isArray(experiences)
      ? experiences
      : JSON.parse(experiences || "[]");

    if (!experienceList.length) {
      return res.status(400).json({
        success: false,
        message: "At least one experience record required"
      });
    }

    // Validate each record
    for (let i = 0; i < experienceList.length; i++) {
      const row = experienceList[i];
      if (!row.employerName) {
        return res.status(400).json({
          success: false,
          message: `Employer Name required at row ${i + 1}`
        });
      }
      if (!row.fromDate) {
        return res.status(400).json({
          success: false,
          message: `From Date required at row ${i + 1}`
        });
      }
      row.draftId = draftId;
    }

    // Remove old experience entries and insert new ones
    await TempExperience.deleteMany({ draftId });
    await TempExperience.insertMany(experienceList);

    // Sync to Master for UI display
    let master = await EmployeeMaster.findOne({ draftId });
    if (!master) master = new EmployeeMaster({ draftId });

    master.experienceDetails = experienceList;

    master.status = "draft";
    await master.save();

    // Fetch updated list for response
    const savedData = await TempExperience.find({ draftId }).sort({ serialNo: 1 });

    return res.status(200).json({
      success: true,
      message: "Experience details saved & synced successfully",
      draftId,
      data: savedData
    });

  } catch (error) {
    console.error("Experience Save Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save experience details",
      error: error.message
    });
  }
};

exports.syncFamilyDetails = async (req, res) => {
  try {
    const { draftId, family } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required"
      });
    }

    // Parse array if sent as JSON string (FormData cases)
    const familyList = Array.isArray(family)
      ? family
      : JSON.parse(family || "[]");

    if (!familyList.length) {
      return res.status(400).json({
        success: false,
        message: "At least 1 family member required"
      });
    }

    // Validate each member
    for (let i = 0; i < familyList.length; i++) {
      const row = familyList[i];

      if (!row.name?.trim()) {
        return res.status(400).json({
          success: false,
          message: `Name missing at row ${i + 1}`
        });
      }

      if (!row.relation?.trim()) {
        return res.status(400).json({
          success: false,
          message: `Relation missing at row ${i + 1}`
        });
      }

      // Ensure draftId is set per row
      row.draftId = draftId;
    }

    // DELETE old family records and INSERT new ones (Approach B)
    await TempFamily.deleteMany({ draftId });
    await TempFamily.insertMany(familyList);

    // ********* SYNC TO MASTER *********
    let master = await EmployeeMaster.findOne({ draftId });
    if (!master) master = new EmployeeMaster({ draftId });

    master.familyDetails = familyList;

    master.status = "draft";
    await master.save();
    // **********************************

    // Fetch saved family list for response
    const savedFamily = await TempFamily.find({ draftId });

    return res.status(200).json({
      success: true,
      message: "Family details saved & synced successfully",
      draftId,
      data: savedFamily
    });

  } catch (error) {
    console.error("Family Save Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save family details",
      error: error.message
    });
  }
};


// Step 5: Declaration Sync
exports.syncDeclarationDetails = async (req, res) => {
  try {
    const { draftId } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required"
      });
    }

    // Extract fields directly (everything comes from req.body)
    const declarationData = req.body;

    // FILE UPLOADS for signatures if needed
    if (req.files?.specimenSignature1) {
      declarationData.specimenSignature1Url =
        req.files.specimenSignature1[0].path;
    }
    if (req.files?.specimenSignature2) {
      declarationData.specimenSignature2Url =
        req.files.specimenSignature2[0].path;
    }
    if (req.files?.declarationSignature) {
      declarationData.declarationSignatureUrl =
        req.files.declarationSignature[0].path;
    }

    // SAVE OR UPDATE TEMP DOCUMENT
    let temp = await TempDeclaration.findOne({ draftId });

    if (!temp) {
      temp = new TempDeclaration({ draftId, ...declarationData });
    } else {
      Object.assign(temp, declarationData);
    }

    await temp.save();

    // ******** SYNC WITH MASTER DOCUMENT ********
    let master = await EmployeeMaster.findOne({ draftId });
    if (!master) master = new EmployeeMaster({ draftId });

   master.declarationDetails = temp.toObject();


    master.status = "draft";
    await master.save();
    // ********************************************

    return res.status(200).json({
      success: true,
      message: "Declaration details saved & synced",
      draftId,
      data: temp
    });

  } catch (error) {
    console.error("Declaration Save Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save declaration details",
      error: error.message
    });
  }
};

//Step 6:Offece Information Sync
exports.syncOfficeUseDetails = async (req, res) => {
  try {
    const { draftId } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required"
      });
    }

    // Save data directly
    const officeData = req.body;

    // SAVE/UPDATE TEMP COLLECTION
    let temp = await TempOffice.findOne({ draftId });

    if (!temp) {
      temp = new TempOffice({ draftId, ...officeData });
    } else {
      Object.assign(temp, officeData);
    }

    await temp.save();

    // ********** SYNC WITH MASTER **********
    let master = await EmployeeMaster.findOne({ draftId });
    if (!master) master = new EmployeeMaster({ draftId });

    master.officeUseDetails = temp.toObject();
    master.status = "submitted";  // HR filled means onboarding submitted
    master.approvedBy = req.admin?._id || null;
    await master.save();
    // **************************************

    return res.status(200).json({
      success: true,
      message: "Office use details saved & synced successfully",
      draftId
    });

  } catch (error) {
    console.error("Office Save Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save office details",
      error: error.message
    });
  }
};

exports.mergeOnboarding = async (req, res) => {
  try {
    const { draftId } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required"
      });
    }

    const master = await EmployeeMaster.findOne({ draftId });

    if (!master) {
      return res.status(404).json({
        success: false,
        message: "Master onboarding data not found"
      });
    }

    // Correct field name validation
    if (
      !master.personal ||
      !master.pfDetails ||
      !master.academicDetails?.length ||
      !master.experienceDetails?.length ||
      !master.familyDetails?.length ||
      !master.declarationDetails ||
      !master.officeUseDetails
    ) {
      return res.status(400).json({
        success: false,
        message: "All onboarding sections must be completed before final approval"
      });
    }

    // Generate Employee Code
    const employeeCode = "EMP-" + draftId.slice(-4).toUpperCase();

    master.employeeCode = employeeCode;
    master.status = "approved";
    master.approvedBy = req.admin?._id || null;
    master.approvedAt = new Date();

    await master.save();

    // Delete temp data after successful merge
    await Promise.all([
      TempPersonal.deleteOne({ draftId }),
      TempPF.deleteOne({ draftId }),
      TempAcademic.deleteOne({ draftId }),
      TempExperience.deleteOne({ draftId }),
      TempFamily.deleteOne({ draftId }),
      TempDeclaration.deleteOne({ draftId }),
      TempOffice.deleteOne({ draftId }),
    ]);

    res.status(200).json({
      success: true,
      message: "Onboarding completed and merged successfully",
      employeeCode,
      data: master
    });

  } catch (error) {
    console.error("Merge Onboarding Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete onboarding",
      error: error.message
    });
  }
};



// Fetch Complete Details of One Employee (After Final Merge)
exports.getEmployeeDetails = async (req, res) => {
  try {
    const { employeeCode } = req.params;

    const employee = await EmployeeMaster.findOne({ employeeCode });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error("Get Employee Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee details",
      error: error.message
    });
  }
};

// Fetch all completed (final merged) employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await EmployeeMaster.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });

  } catch (error) {
    console.error("Get Employees Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
      error: error.message
    });
  }
};
