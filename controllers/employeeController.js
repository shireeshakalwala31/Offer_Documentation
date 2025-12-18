const EmployeeMaster = require("../models/onboarding/EmployeeMaster");
const TempPersonal = require("../models/onboarding/TempPersonal");
const TempPF=require("../models/onboarding/TempPF")
const TempAcademic=require("../models/onboarding/TempAcademic")
const TempExperience = require("../models/onboarding/TempExperience");
const TempFamily = require("../models/onboarding/TempFamily");
const TempDeclaration = require("../models/onboarding/TempDeclaration");
const TempOffice = require("../models/onboarding/TempOffice");
const { v4: uuidv4 } = require("uuid");
const { generateToken } = require("../utils/generateToken");
const EmployeeUser = require("../models/onboarding/EmployeeUser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


exports.registerEmployee = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing user
    const exists = await EmployeeUser.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const user = new EmployeeUser({
      firstName,
      lastName,
      email,
      password: hashed,
      role: "employee" // Important: ensure role is set
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Employee registered successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Employee Register Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Login
exports.loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await EmployeeUser.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // FIX: Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: "employee" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Employee Login Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Step 1:Personal Information Sync

exports.syncPersonalInfo = async (req, res) => {
  try {
    console.log("----- Incoming Personal Info Request -----");
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Raw Body:", req.body);
    console.log("File:", req.file);

    // PARSE FORM-DATA STRING BODY SAFELY
    let parsedBody = {};
    try {
      parsedBody =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (parseErr) {
      parsedBody = req.body;
    }

    console.log("PARSED BODY =>", parsedBody);

    // FRONTEND → BACKEND FIELD NORMALIZATION
    const payload = {
      ...parsedBody,
      email:
        parsedBody.email ||
        parsedBody.personalEmail ||
        parsedBody.userEmail ||
        "",

      // DOB variations
      dateOfBirth: parsedBody.dateOfBirth || parsedBody.dob,

      // Aadhar variations
      aadhaar: parsedBody.aadhaar || parsedBody.aadhar,

      // Phone variations
      permanentPhone:
        parsedBody.permanentPhone || parsedBody.permPhone || "",
      presentPhone: parsedBody.presentPhone,

      maritalStatus: parsedBody.maritalStatus || "Single",
      marriageDate: parsedBody.marriageDate || null
    };

    const {
      draftId,
      firstName,
      lastName,
      gender,
      email,
      maritalStatus,
      marriageDate,
      dateOfBirth,
      aadhaar,
      pan,
      presentPhone,
      permanentPhone,
      ...restFields
    } = payload;

    // =========================
    // VALIDATION
//

    if (!email || email.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First Name and Last Name are required"
      });
    }

    if (!gender) {
      return res.status(400).json({
        success: false,
        message: "Gender is required"
      });
    }

    if (!dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Date of Birth is required"
      });
    }

    if (maritalStatus === "Married" && !marriageDate) {
      return res.status(400).json({
        success: false,
        message: "Marriage Date is required for Married employees"
      });
    }

    // GENERATE DRAFT ID IF MISSING
    const generatedDraftId =
      draftId && draftId.trim() !== ""
        ? draftId
        : `DRAFT-${uuidv4()}`;

    // HANDLE FILE (PHOTO)
    let photo = undefined;
    if (req.file) {
      photo = {
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        base64: req.file.buffer.toString("base64"),
        uploadedAt: new Date()
      };
    }

    // =========================
    // UPSERT INTO TEMP PERSONAL
    //==========================

    let temp = await TempPersonal.findOne({
      draftId: generatedDraftId
    });

    if (!temp) {
      temp = new TempPersonal({
        draftId: generatedDraftId,
        firstName,
        lastName,
        gender,
        email,
        dateOfBirth,
        aadhaar,
        pan,
        presentPhone,
        permanentPhone,
        maritalStatus,
        marriageDate:
          maritalStatus === "Married" ? marriageDate : null,
        ...restFields
      });
    } else {
      Object.assign(temp, payload);

      // Force remove marriageDate if not Married
      if (maritalStatus !== "Married") {
        temp.marriageDate = null;
      }
    }

    if (photo) temp.photoUrl = photo;

    await temp.save();

    // =========================
    // SYNC TO MASTER
    // ==========================

    let master = await EmployeeMaster.findOne({
      draftId: generatedDraftId
    });

    if (!master) {
      master = new EmployeeMaster({ draftId: generatedDraftId });
    }

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
exports.syncPFInfo = async (req, res) => {
  try {
    console.log("\n===== PF INFO: Incoming Data =====");
    console.log(JSON.stringify(req.body, null, 2));

    const b = req.body || {};

    if (!b.draftId) {
      return res.status(400).json({
        success: false,
        message: "Draft ID is required",
      });
    }

    // VALIDATIONS
    if (b.bankAccountNumber && !/^[0-9]{8,18}$/.test(String(b.bankAccountNumber))) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bank Account Number",
      });
    }

    if (b.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(b.ifscCode).toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid IFSC Code",
      });
    }

    if (b.uanNumber && !/^[0-9]{12}$/.test(String(b.uanNumber))) {
      return res.status(400).json({
        success: false,
        message: "UAN Number must be 12 digits",
      });
    }

    // NORMALIZE AND MAP FRONTEND FIELDS
    const payload = {
      draftId: b.draftId,

      pfAction: b.pfAction || "",

      uanNumber: b.uanNumber ?? b.uan ?? null,
      existingPfNumber: b.existingPfNumber ?? b.pfNumber ?? null,

      bankAccountNumber: b.bankAccountNumber ?? b.bankAcc ?? null,
      bankName: b.bankName || "",

      ifscCode: (b.ifscCode ?? b.ifsc ?? "")
        .toString()
        .trim()
        .toUpperCase(),

      passportNumber: b.passportNumber ?? b.passport ?? null,
      passportValidity: b.passportValidity ?? b.validity ?? "",
      placeOfIssue: b.placeOfIssue ?? b.issuePlace ?? "",

      languages: (() => {
        if (Array.isArray(b.languagesKnown)) return b.languagesKnown;
        if (Array.isArray(b.languages)) return b.languages;
        if (typeof b.languagesKnown === "string") {
          return b.languagesKnown.split(",").map((x) => x.trim()).filter(Boolean);
        }
        if (typeof b.languages === "string") {
          return b.languages.split(",").map((x) => x.trim()).filter(Boolean);
        }
        return [];
      })(),

      motherTongue: b.motherTongue || "",
      idMark1: b.idMark1 ?? b.identificationMark1 ?? "",
      idMark2: b.idMark2 ?? b.identificationMark2 ?? "",

      mobileNumber: b.mobileNumber ?? b.mobile ?? "",
      email: b.email ? b.email.toLowerCase() : "",
    };

    console.log("\n===== PF INFO: Normalized Payload =====");
    console.log(JSON.stringify(payload, null, 2));

    // FIND OR CREATE TEMP DOCUMENT
    let temp = await TempPF.findOne({ draftId: payload.draftId }).lean(false);

    if (!temp) {
      console.log("PF: Creating new TempPF document");
      temp = new TempPF(payload);
    } else {
      console.log("PF: Updating existing TempPF document");
      temp.set(payload);

      // Mixed type fields → mark modified so Mongoose saves them
      ["uanNumber", "existingPfNumber", "bankAccountNumber", "passportNumber", "languages"]
        .forEach((field) => temp.markModified(field));
    }

    await temp.save(); // encryption happens here (pre-save hooks)

    console.log("\n===== PF INFO: Saved TempPF Document =====");
    console.log(JSON.stringify(temp.toObject(), null, 2));

    // SYNC INTO EMPLOYEE MASTER
    let master = await EmployeeMaster.findOne({ draftId: payload.draftId });
    if (!master) master = new EmployeeMaster({ draftId: payload.draftId });

    master.pfDetails = temp.toObject();
    master.status = "draft";

    await master.save();

    return res.status(200).json({
      success: true,
      message: "PF Details saved & synced successfully",
      draftId: payload.draftId,
      data: temp.toObject(),
    });

  } catch (err) {
    console.error("PF Save Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to save PF details",
      error: err.message,
    });
  }
};
// Step 3: Academic Information Sync
exports.syncAcademicDetails = async (req, res) => {
  try {
    const { draftId } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required",
      });
    }

    // Academic List (Array or JSON string)
    let academicList = [];

    if (req.body.academics) {
      try {
        academicList = Array.isArray(req.body.academics)
          ? req.body.academics
          : JSON.parse(req.body.academics);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid academics format. Must be array or JSON string.",
        });
      }
    }

    if (!academicList.length) {
      return res.status(400).json({
        success: false,
        message: "At least one academic entry is required.",
      });
    }

    // ========================================
    // NORMALIZE + VALIDATE EACH ENTRY
    // ========================================
    const normalizedList = academicList.map((row, i) => {
      const rowNo = i + 1;
      const r = row || {};

      // Get Base64 document OR url
      const document = {};

      if (r.document && typeof r.document === "object") {
        // Already structured document
        document.fileName = r.document.fileName || "";
        document.mimeType = r.document.mimeType || "";
        document.fileSize = r.document.fileSize || 0;
        document.base64 = r.document.base64 || "";
        document.url = r.document.url || "";
        document.uploadedAt = new Date();
      } 
      else if (r.documentUrl) {
        document.url = r.documentUrl;
        document.uploadedAt = new Date();
      } 
      else if (r.fileBase64) {
        document.base64 = r.fileBase64;
        document.uploadedAt = new Date();
      }

      const normalized = {
        draftId,
        serialNo: rowNo,

        qualification:
          r.qualification ||
          r.course ||
          r.degree ||
          "",

        Specialization:
          r.Specialization ||
          r.specialization ||
          r.subject ||
          "",

        schoolOrCollege:
          r.schoolOrCollege ||
          r.instituteName ||
          r.collegeName ||
          r.school ||
          "",

        boardOrUniversity:
          r.boardOrUniversity ||
          r.university ||
          r.board ||
          "",

        marks: r.marks || r.score || "",

        studyMode:
          r.studyMode ||
          r.mode ||
          r.type ||
          "",

        passYear:
          r.passYear ||
          r.yearOfPassing ||
          "",

        certificateNo: r.certificateNo || "",

        document,
      };

      // ===== VALIDATION =====
      if (!normalized.qualification.trim())
        throw new Error(`Qualification missing at row ${rowNo}`);

      if (!normalized.schoolOrCollege.trim())
        throw new Error(`School/College missing at row ${rowNo}`);

      if (!normalized.boardOrUniversity.trim())
        throw new Error(`Board/University missing at row ${rowNo}`);

      if (!normalized.passYear.trim())
        throw new Error(`Pass Year missing at row ${rowNo}`);

      return normalized;
    });

    // ========================================
    // DELETE -> INSERT
    // ========================================
    await TempAcademic.deleteMany({ draftId });
    await TempAcademic.insertMany(normalizedList);

    // ========================================
    // SYNC TO EmployeeMaster
    // ========================================
    let master = await EmployeeMaster.findOne({ draftId });

    if (!master) master = new EmployeeMaster({ draftId });

    master.academicDetails = normalizedList;
    master.status = "draft";
    await master.save();

    return res.status(200).json({
      success: true,
      message: "Academic details saved & synced successfully",
      draftId,
      data: normalizedList,
    });

  } catch (error) {
    console.error("Academic Save Error:", error.stack || error);
    return res.status(500).json({
      success: false,
      message: "Backend Failure",
      error: error.message,
    });
  }
};




// STEP-4: Experience Save + Sync
exports.syncExperienceDetails = async (req, res) => {
  console.log("RAW EXPERIENCE BODY =>", req.body);

  try {
    const { draftId } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required",
      });
    }

    let experiences = req.body.experience || req.body.experiences;

    // Handle JSON string from FormData
    if (typeof experiences === "string") {
      try {
        experiences = JSON.parse(experiences);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid experience format (not valid JSON)",
        });
      }
    }

    // Must be array
    if (!Array.isArray(experiences) || experiences.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one experience entry is required.",
      });
    }

    // Normalize + validate
    const finalList = experiences.map((row, index) => {
      const rowNo = index + 1;

      const employerName =
        row.employerName ||
        row.companyName ||
        row.organization ||
        row.employer ||
        "";

      // ACCEPT ALL POSSIBLE fromDate KEY VARIANTS
      const fromDate =
        row.fromDate ||
        row.startDate ||
        row.from ||
        row.from_date ||
        row.experienceFrom ||
        "";

      // ACCEPT ALL POSSIBLE toDate VARIANTS
      const toDate =
        row.toDate ||
        row.endDate ||
        row.to ||
        row.to_date ||
        row.experienceTo ||
        "";

      if (!employerName.trim()) throw new Error(`Employer Name required at row ${rowNo}`);
      if (!fromDate) throw new Error(`From Date required at row ${rowNo}`);
      if (!toDate) throw new Error(`To Date required at row ${rowNo}`);

      return {
        draftId,
        serialNo: rowNo,

        employerName: employerName.trim(),
        designation: row.designation || row.role || "",

        fromDate,
        toDate,

        employerAddress: row.employerAddress || row.address || "",
        salaryPA: row.salaryPA || row.salary || row.lastSalary || "",
        reasonForLeaving: row.reasonForLeaving || row.reason || "",

        functionalSkills: row.functionalSkills || "",
        technicalSkills: row.technicalSkills || "",
        professionalAchievements: row.professionalAchievements || "",

        nomineeName: row.nomineeName || "",
        nomineeDob: row.nomineeDob || "",
        nomineeRelationship: row.nomineeRelationship || "",

        height: row.height || "",
        weight: row.weight || "",
        powerOfGlassLeft: row.powerOfGlassLeft || "",
        powerOfGlassRight: row.powerOfGlassRight || "",
        majorSurgeryOrIllness: row.majorSurgeryOrIllness || "",
        prolongedSickness: row.prolongedSickness || "",
        accidentHistory: row.accidentHistory || "",
        foreignObjectInBody: row.foreignObjectInBody || "",

        ...row // Keep any extra fields
      };
    });

    // Save Temp
    await TempExperience.deleteMany({ draftId });
    await TempExperience.insertMany(finalList);

    // Save Master
    let master = await EmployeeMaster.findOne({ draftId });
    if (!master) master = new EmployeeMaster({ draftId });

    master.experienceDetails = finalList;
    master.status = "draft";
    await master.save();

    return res.status(200).json({
      success: true,
      message: "Experience details saved successfully",
      data: finalList,
    });

  } catch (error) {
    console.error("Experience Save Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
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


// Step 5: Declaration Sync (FINAL – FIXED)
exports.syncDeclarationDetails = async (req, res) => {
  try {
    const { draftId } = req.body;
    if (!draftId) {
      return res.status(400).json({ success: false, message: "draftId is required" });
    }

    const body = req.body;

    /* 🔑 FRONTEND → BACKEND FIELD MAPPING */
    const mappedData = {
      draftId,

      keepOriginalCertificates: body.keepOriginalCertificates ?? undefined,

      willingServiceAgreement: body.agreeServiceAgreement ?? undefined,
      willingToWorkAnywhere: body.willingToWorkAnyUnit ?? undefined,
      agreeCompanyTerms: body.agreeOtherTerms ?? undefined,

      doYouSmoke: body.doYouSmoke ?? undefined,
      areYouAlcoholic: body.areYouAlcoholic ?? undefined,

      medicallyFit: body.medicallyFitDeclaration ?? undefined,
      convictedInCourt: body.convictedInCourt ?? undefined,

      haveProfessionalMembership: body.membershipProfessionalBody ?? undefined,
      membershipDetails: body.professionalBodyName || "",

      name: body.name || "",
      signature: body.signature || "",
      date: body.date || null,
    };

    /* 🔑 REMOVE undefined (prevents null overwrite) */
    Object.keys(mappedData).forEach((k) => {
      if (mappedData[k] === undefined) delete mappedData[k];
    });

    let temp = await TempDeclaration.findOne({ draftId });
    if (!temp) temp = new TempDeclaration({ draftId });

    Object.assign(temp, mappedData);
    await temp.save();

    let master = await EmployeeMaster.findOne({ draftId });
    if (!master) master = new EmployeeMaster({ draftId });

    master.declarationDetails = temp.toObject();
    master.status = "draft";
    await master.save();

    return res.json({
      success: true,
      message: "Declaration saved",
      data: temp,
    });

  } catch (error) {
    console.error("Declaration Save Error:", error);
    res.status(500).json({ success: false, error: error.message });
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

    // Validate all required onboarding sections
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

    // Status updated by employee
    master.status = "submitted";
    master.approvedAt = new Date();

    await master.save();

    // Delete temporary onboarding data
    await Promise.all([
      TempPersonal.deleteOne({ draftId }),
      TempPF.deleteOne({ draftId }),
      TempAcademic.deleteOne({ draftId }),
      TempExperience.deleteOne({ draftId }),
      TempFamily.deleteOne({ draftId }),
      TempDeclaration.deleteOne({ draftId }),
      TempOffice.deleteOne({ draftId }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Onboarding submitted successfully",
      data: master
    });

  } catch (error) {
    console.error("Merge Onboarding Error:", error);
    return res.status(500).json({
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
