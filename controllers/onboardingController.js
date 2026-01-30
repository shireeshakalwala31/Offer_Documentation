const logger = require('../logger/logger');
const Messages = require('../MsgConstants/messages');
const PDFDocument = require("pdfkit");
const { encryptText, decryptText } = require('../utils/cryptoUtil');
const { syncCandidateSection } = require("../utils/syncCandidate");

const BasicInfo = require("../models/BasicInfo");
const OfferDetails = require("../models/OfferDetails");
const Qualification=require("../models/Qualification")
const BankDetails=require('../models/BankDetails')
const EmploymentDetails=require('../models/EmploymentDetails')
const OnboardedCandidate = require("../models/OnboardedCandidate");

exports.saveBasicInfo = async (req, res) => {
  try {
    const {
      draftId: existingDraftId,
      salutation,
      firstName,
      lastName,
      fatherName,
      email,
      countryCode,
      phoneNumber,
      gender,
      aadharNumber,
      panNumber
    } = req.body;

    if (!fatherName?.trim()) {
      return res.status(400).json({ success: false, message: "fatherName is required" });
    }

    if (!phoneNumber?.trim()) {
      return res.status(400).json({ success: false, message: "phoneNumber is required" });
    }

    let draftId = existingDraftId || BasicInfo.generateDraftId(aadharNumber, panNumber);

    const attachments = {};
    if (req.files?.length > 0) {
      req.files.forEach(file => {
        attachments[file.fieldname] = {
          fileName: file.originalname,
          base64: file.buffer.toString("base64"),
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedAt: new Date()
        };
      });
    }

    let record = await BasicInfo.findOne({ draftId });
    if (!record) record = new BasicInfo({ draftId });

    if (!attachments.aadhar && !record.aadharAttachment)
      return res.status(400).json({ success: false, message: "aadharAttachment is required" });

    if (!attachments.pan && !record.panAttachment)
      return res.status(400).json({ success: false, message: "panAttachment is required" });

    record.salutation = salutation;
    record.firstName = firstName;
    record.lastName = lastName;
    record.fatherName = fatherName;
    record.email = email;
    record.countryCode = countryCode;
    record.phoneNumber = phoneNumber;
    record.gender = gender;

    if (aadharNumber) {
      record.setAadhar(aadharNumber);
      record.aadharNumber = aadharNumber;
    }

    if (panNumber) {
      record.setPan(panNumber);
      record.panNumber = panNumber;
    }

    if (attachments.aadhar) record.aadharAttachment = attachments.aadhar;
    if (attachments.pan) record.panAttachment = attachments.pan;

    await record.save();

    await syncCandidateSection(draftId, "basicInfo", {
      ...record.toObject(),
      aadharNumber: record.aadharNumber,
      panNumber: record.panNumber,
    });

    return res.status(200).json({
      success: true,
      message: "Basic info saved",
      draftId,
      data: record
    });

  } catch (err) {
    console.error("Basic Save Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to save basic info",
      error: err.message
    });
  }
};


// Qulification Controller
exports.saveQulification = async (req, res) => {
  try {
    const { draftId, education } = req.body;

    if (!draftId) {
      return res.status(400).json({ success: false, message: "draftId is required" });
    }

    // Parse education array if string
    let educationArray = Array.isArray(education)
      ? education
      : JSON.parse(education || "[]");

    if (!educationArray.length) {
      return res.status(400).json({ success: false, message: "Education array required" });
    }

    // Qualification types NOT requiring specialization
    const NO_SUBBRANCH = ["10th", "ssc", "sslc", "hsc"];

    // Validate and normalize data
    for (let i = 0; i < educationArray.length; i++) {
      const item = educationArray[i];
      const qual = (item.qualification || "").toLowerCase();

      if (!NO_SUBBRANCH.some(q => qual.includes(q))) {
        if (!item.subbranch || item.subbranch.trim() === "") {
          return res.status(400).json({
            success: false,
            message: `subbranch required for ${item.qualification} at index ${i}`
          });
        }
        item.specialization = item.subbranch;
      }

      if (!item.yearPassing?.trim()) {
        return res.status(400).json({
          success: false,
          message: `yearPassing required at index ${i}`
        });
      }

      item.passingYear = item.yearPassing;
    }

    // Handle attachments
    const attachments = {};
    if (req.files?.length) {
      req.files.forEach((file, index) => {
        attachments[`certificateAttachment_${index}`] = {
          fileName: file.originalname,
          base64: file.buffer.toString("base64"),
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedAt: new Date()
        };
      });
    }

    educationArray.forEach((item, index) => {
      const key = `certificateAttachment_${index}`;
      if (attachments[key]) {
        item.certificateAttachment = attachments[key];
      } else if (item.certificateAttachment) {
        // keep existing file when updating
        item.certificateAttachment = item.certificateAttachment;
      }
    });

    // Create or update record
    let record = await Qualification.findOne({ draftId });
    if (!record) record = new Qualification({ draftId });

    record.education = educationArray;
    await record.save();

    // Sync into onboarding master document
    await syncCandidateSection(draftId, "qualification", record.toObject());

    return res.status(200).json({
      success: true,
      message: "Qualification details saved successfully",
      draftId,
      data: record
    });

  } catch (error) {
    console.error("Qualification Save Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save qualification details",
      error: error.message
    });
  }
};

exports.saveOfferDetails = async (req, res) => {
  try {
    const { draftId, offerDetails } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId required for OfferDetails page"
      });
    }

    // Parse offerDetails string if necessary
    let parsedDetails;
    try {
      parsedDetails = typeof offerDetails === "string"
        ? JSON.parse(offerDetails)
        : offerDetails;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format for offerDetails"
      });
    }

    const {
      offerDate,
      dateOfJoining,
      employeeId,
      position,
      department,
      location,
      interviewRemarks
    } = parsedDetails || {};

    // File upload handling
    let attachment = null;
    if (req.files?.length > 0) {
      const file = req.files[0];
      attachment = {
        fileName: file.originalname,
        base64: file.buffer.toString("base64"),
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedAt: new Date()
      };
    }

    let record = await OfferDetails.findOne({ draftId });
    if (!record) record = new OfferDetails({ draftId });

    // Assign new values in all cases
    record.offerDate = offerDate;
    record.dateOfJoining = dateOfJoining;
    record.employeeId = employeeId;
    record.position = position;
    record.department = department;
    record.location = location;
    record.interviewRemarks = interviewRemarks;

    if (attachment) {
      record.offerLetterAttachment = attachment;
    }

    await record.save();

    // 🔹 Sync to OnboardedCandidate (The most important part)
    await syncCandidateSection(draftId, "offerDetails", record.toObject());

    return res.status(200).json({
      success: true,
      message: "Offer details saved & synced successfully",
      draftId,
      data: record
    });

  } catch (error) {
    console.error("Offer Save Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save offer details",
      error: error.message
    });
  }
};

// Bank Details
exports.saveBankDetails = async (req, res) => {
  try {
    const { draftId, bankDetails } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required"
      });
    }

    // Parse JSON from string if required
    let parsedDetails;
    try {
      parsedDetails = typeof bankDetails === "string"
        ? JSON.parse(bankDetails)
        : bankDetails;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format for bankDetails"
      });
    }

    const {
      bankName,
      branchName,
      accountNumber,
      confirmAccountNumber,
      ifscCode
    } = parsedDetails || {};

    if (accountNumber !== confirmAccountNumber) {
      return res.status(400).json({
        success: false,
        message: "Account Number and Confirm Account Number do not match"
      });
    }

    // Convert uploaded attachment
    let attachment = null;
    if (req.files?.length > 0) {
      const file = req.files[0];
      attachment = {
        fileName: file.originalname,
        base64: file.buffer.toString("base64"),
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedAt: new Date()
      };
    }

    let record = await BankDetails.findOne({ draftId });
    if (!record) record = new BankDetails({ draftId });

    record.bankName = bankName;
    record.branchName = branchName;

    record.setBankData(accountNumber, ifscCode);

    // Keep existing attachment when editing
    if (attachment) record.bankAttachment = attachment;

    await record.save();

    // Decrypt data for PDF and UI sync
    const bankSyncData = {
      ...record.toObject(),
      accountNumber: record.getAccountNumber(),
      ifscCode: record.getIfscCode()
    };

    // 🔹 Sync into OnboardedCandidate master doc
   await syncCandidateSection(draftId, "bankDetails", record.toObject());

    return res.status(200).json({
      success: true,
      message: "Bank details saved & synced successfully",
      draftId,
      data: bankSyncData
    });

  } catch (error) {
    console.error("Bank Save Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save bank details",
      error: error.message
    });
  }
};



// employmentController
exports.saveEmployeeDetails = async (req, res) => {
  try {
    const { draftId, employmentDetails } = req.body;

    if (!draftId) {
      return res.status(400).json({ success: false, message: "draftId required" });
    }

    if (!employmentDetails) {
      return res.status(400).json({ success: false, message: "employmentDetails required" });
    }

    // Parse JSON input
    let parsedDetails;
    try {
      parsedDetails = typeof employmentDetails === "string"
        ? JSON.parse(employmentDetails)
        : employmentDetails;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in employmentDetails"
      });
    }

    const {
      employmentType,
      fresherCtc,
      hiredRole,
      generalRemarks,
      isExEmployee,
      companyName,
      joiningCTC,
      durationFrom,
      durationTo,
      offeredCTC,
      experienceRemarks
    } = parsedDetails;

    // Convert uploaded files to Base64
    const attachmentList = (req.files || []).map(file => ({
      fileName: file.originalname,
      base64: file.buffer.toString("base64"),
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date(),
    }));

    let record = await EmploymentDetails.findOne({ draftId });
    if (!record) record = new EmploymentDetails({ draftId });

    // Common Field
    record.employmentType = employmentType;

    // Fresher Case
    if (employmentType === "Fresher") {
      record.fresherCtc = fresherCtc;
      record.hiredRole = hiredRole;
      record.generalRemarks = generalRemarks;

      if (attachmentList.length > 0) {
        record.offerLetterAttachment = attachmentList[0];
      }

      record.experiences = [];
    }

    // Experience Case
    if (employmentType === "Experience") {
      record.experiences = [{
        isExEmployee,
        companyName,
        joiningCTC,
        durationFrom,
        durationTo,
        offeredCTC,
        experienceRemarks,
        payslipAttachments: attachmentList
      }];

      // Remove fresher-only fields if switching type
      record.fresherCtc = undefined;
      record.hiredRole = undefined;
      record.offerLetterAttachment = undefined;
    }

    await record.save();

    // 🔹 Sync into OnboardedCandidate final doc
    await syncCandidateSection(draftId, "employmentDetails", record.toObject());


    return res.status(200).json({
      success: true,
      message: "Employment details saved & synced successfully",
      draftId,
      data: record
    });

  } catch (error) {
    console.error("Employment Save Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save employment details",
      error: error.message
    });
  }
};

exports.fetchDraft = async (req, res) => {
  try {
    const { draftId } = req.query;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required"
      });
    }

    // Fetch all pages using the same draftId
    const basic = await BasicInfo.findOne({ draftId });
    const qualification = await Qualification.findOne({ draftId });
    const offer = await OfferDetails.findOne({ draftId });
    const bank = await BankDetails.findOne({ draftId });
    const employment = await EmploymentDetails.findOne({ draftId });

    return res.status(200).json({
      success: true,
      draftId,
      data: {
        basicInfo: basic,
        qualification,
        offerDetails: offer,
        bankDetails: bank,
        employmentDetails: employment
      }
    });

  } catch (error) {
    console.error("Fetch Draft Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch draft data",
      error: error.message
    });
  }
};
exports.finalSubmit = async (req, res) => {
  try {
    const { draftId } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: "draftId is required"
      });
    }

    const candidate = await OnboardedCandidate.findOne({ draftId });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    if (candidate.status === "submitted") {
      return res.status(400).json({
        success: false,
        message: "This draft is already submitted"
      });
    }

    const requiredSections = [
      "basicInfo",
      "qualification",
      "offerDetails",
      "bankDetails",
      "employmentDetails"
    ];

    for (const sec of requiredSections) {
      if (!candidate[sec]) {
        return res.status(400).json({
          success: false,
          message: `${sec} is missing. Please fill all sections.`
        });
      }
    }

    await OnboardedCandidate.updateOne(
      { draftId },
      {
        status: "submitted",
        submittedAt: new Date()
      }
    );

    return res.status(200).json({
      success: true,
      message: "Onboarding successfully submitted"
    });

  } catch (error) {
    console.error("Final Submit Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit onboarding",
      error: error.message
    });
  }
};


// GET CANDIDATES + PAGINATION + SEARCH
exports.getCandidatesWithSearch = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;

    page = Number(page);
    limit = Number(limit);

    // Build search filter
    let searchFilter = {};

    if (search && search.trim() !== "") {
      const regex = new RegExp(search, "i"); // case-insensitive search

      // Search inside basicInfo for name/email/phone
      searchFilter = {
        $or: [
          { "basicInfo.firstName": regex },
          { "basicInfo.lastName": regex },
          { "basicInfo.email": regex },
          { "basicInfo.phoneNumber": regex }
        ]
      };
    }

    const total = await OnboardedCandidate.countDocuments(searchFilter);

    const candidates = await OnboardedCandidate.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: candidates
    });

  } catch (error) {
    console.error("Pagination Search Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch candidates",
      error: error.message
    });
  }
};

// Get specific onboarded candidate by draftId OR _id
exports.getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID or draftId is required"
      });
    }

    // Try to find by draftId first
    let candidate = await OnboardedCandidate.findOne({ draftId: id });

    // If not found → try MongoDB _id
    if (!candidate) {
      try {
        candidate = await OnboardedCandidate.findById(id);
      } catch (err) {
        // Ignore invalid _id format — do not break
      }
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    console.error("Get Candidate Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch candidate information",
      error: error.message
    });
  }
};

// DELETE Candidate by draftId or _id
exports.deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    // Find candidate by draftId or _id
    let candidate = await OnboardedCandidate.findOne({ draftId: id });
    if (!candidate) {
      try { candidate = await OnboardedCandidate.findById(id); }
      catch (_) {}
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    const draftId = candidate.draftId;

    // Delete from all collections
    await OnboardedCandidate.deleteOne({ draftId });
    await BasicInfo.deleteOne({ draftId });
    await Qualification.deleteOne({ draftId });
    await OfferDetails.deleteOne({ draftId });
    await BankDetails.deleteOne({ draftId });
    await EmploymentDetails.deleteOne({ draftId });

    return res.status(200).json({
      success: true,
      message: "Candidate deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete candidate",
      error: error.message
    });
  }
};

// Mapping sections → Mongoose Models
const SECTION_FIELD_MAP = {
  basic: "basicInfo",
  qualification: "qualification",
  offer: "offerDetails",
  bank: "bankDetails",
  employment: "employmentDetails"
};

exports.updateSection = async (req, res) => {
  try {
    const { draftId, section, data } = req.body;

    if (!draftId || !section || !data) {
      return res.status(400).json({
        success: false,
        message: "draftId, section and data are required"
      });
    }

    const field = SECTION_FIELD_MAP[section];
    if (!field) {
      return res.status(400).json({
        success: false,
        message: "Invalid section name"
      });
    }

    const updated = await OnboardedCandidate.findOneAndUpdate(
      { draftId },
      { $set: { [field]: data } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `${section} updated successfully`,
      data: updated
    });

  } catch (error) {
    console.error("updateSection Error:", error);
    return res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message
    });
  }
};

// Map sections → Mongoose Models
// const MODEL_MAP = {
//   basic: BasicInfo,
//   qualification: Qualification,
//   offer: OfferDetails,
//   bank: BankDetails,
//   employment: EmploymentDetails
// };

// 🔥 Base64 Conversion Directly Here (INSTEAD of fileHandler.js)
function prepareBase64Files(files = []) {
  const attachments = {};

  files.forEach((file) => {
    attachments[file.fieldname] = {
      fileName: file.originalname,
      base64: file.buffer.toString("base64"),
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date()
    };
  });

  return attachments;
}

// exports.uploadAnySectionFiles = async (req, res) => {
//   try {
//     const { draftId, section } = req.body;

//     if (!draftId || !section) {
//       return res.status(400).json({
//         success: false,
//         message: "draftId and section are required"
//       });
//     }

//     // Validate section
//     const Model = MODEL_MAP[section];
//     if (!Model) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid section. Allowed: basic, qualification, offer, bank, employment"
//       });
//     }

//     // Convert uploaded files → Base64 map (NOW using inline function)
//     const attachments = prepareBase64Files(req.files);

//     let record = await Model.findOne({ draftId });
//     if (!record) record = new Model({ draftId });

//     // -----------------------
//     // PAGE 1 — BASIC INFO
//     // -----------------------
//     if (section === "basic") {
//       if (attachments.aadhar) record.aadharAttachment = attachments.aadhar;
//       if (attachments.pan) record.panAttachment = attachments.pan;
//     }

//     // -----------------------
//     // PAGE 2 — QUALIFICATION
//     // -----------------------
//     if (section === "qualification") {
//       // Keep qualification uploads optional; do not enforce or store root-level OD/marksheet
//       // Qualification certificates are handled per education item in saveQulification
//     }

//     // -----------------------
//     // PAGE 3 — OFFER DETAILS
//     // -----------------------
//     if (section === "offer") {
//       if (attachments.offerLetter) record.offerLetterAttachment = attachments.offerLetter;
//     }

//     // -----------------------
//     // PAGE 4 — BANK DETAILS
//     // -----------------------
//     if (section === "bank") {
//       if (attachments.bankAttachment) record.bankAttachment = attachments.bankAttachment;
//     }

//     // -----------------------
//     // PAGE 5 — EMPLOYMENT
//     // -----------------------
//     if (section === "employment") {
//       if (!record.experiences || record.experiences.length === 0) {
//         record.experiences = [{ payslipAttachments: [] }];
//       }

//       Object.keys(attachments).forEach((key) => {
//         record.experiences[0].payslipAttachments.push(attachments[key]);
//       });
//     }

//     await record.save();

//     return res.status(200).json({
//       success: true,
//       message: `${section.toUpperCase()} file(s) uploaded successfully`,
//       data: record
//     });

//   } catch (error) {
//     console.error("Combined Upload Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "File upload failed",
//       error: error.message
//     });
//   }
// };

exports.downloadSingleFile = async (req, res) => {
  try {
    const { id, section, fileName } = req.params;
    const decodedFileName = decodeURIComponent(fileName);

    const SECTION_KEY_MAP = {
      basicInfo: ["basic", "basicinfo", "basic-info", "basic_information"],
      qualification: ["qualification", "edu", "education"],
      offerDetails: ["offer", "offers", "offer-details"],
      bankDetails: ["bank", "bank-info", "bankdetails"],
      employmentDetails: ["employment", "employee", "work", "employment-details"]
    };

    let targetField = Object.keys(SECTION_KEY_MAP).find(key =>
      SECTION_KEY_MAP[key].includes(section.toLowerCase())
    );

    if (!targetField) {
      return res.status(400).json({ success: false, message: "Invalid section" });
    }

    let candidate =
      await OnboardedCandidate.findOne({ draftId: id }).lean() ||
      await OnboardedCandidate.findById(id).lean();

    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const secObj = candidate[targetField];
    if (!secObj) {
      return res.status(404).json({ success: false, message: "Section not available" });
    }

    let file = null;

    if (targetField === "basicInfo") {
      file = [secObj.aadharAttachment, secObj.panAttachment]
        .find(f => f?.fileName === decodedFileName);
    }

    if (targetField === "qualification") {
      file = secObj.education?.flatMap(e => e.certificateAttachment || [])
        .find(f => f.fileName === decodedFileName);
    }

    if (targetField === "offerDetails") {
      file = secObj.offerLetterAttachment?.fileName === decodedFileName
        ? secObj.offerLetterAttachment
        : null;
    }

    if (targetField === "bankDetails") {
      file = secObj.bankAttachment?.fileName === decodedFileName
        ? secObj.bankAttachment
        : null;
    }

    if (targetField === "employmentDetails") {
      for (const exp of secObj.experiences || []) {
        if (exp.offerLetterAttachment?.fileName === decodedFileName) {
          file = exp.offerLetterAttachment;
          break;
        }
        file = exp.payslipAttachments?.find(f => f.fileName === decodedFileName);
        if (file) break;
      }
    }

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const buffer = Buffer.from(file.base64, "base64");
    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${file.fileName}"`
    });

    res.send(buffer);

  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).json({
      success: false,
      message: "Download failed",
      error: err.message
    });
  }
};


// Convert base64 → buffer
function bufferFromBase64(b64) {
  return Buffer.from(b64, "base64");
}

// Detect if file is image
function isImageAttachment(att) {
  if (!att) return false;
  const name = (att.fileName || "").toLowerCase();
  const mime = (att.mimeType || "").toLowerCase();

  return (
    mime.startsWith("image/") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".gif") ||
    name.endsWith(".bmp") ||
    name.endsWith(".webp")
  );
}

// Render either embedded image OR download link
function renderAttachmentBlock(doc, label, attachment, candidate, sectionKey) {
  doc.fontSize(12).text(label);

  if (!attachment || !attachment.base64) {
    doc.text("None");
    doc.moveDown(0.5);
    return;
  }

  const fileName = attachment.fileName || "Attachment";

  const baseUrl =
    process.env.PUBLIC_WEB_URL ||
    "https://offer-documentation.onrender.com";

  const id = candidate.draftId || candidate._id;

  const downloadUrl = `${baseUrl}/api/candidate/${id}/${sectionKey}/${encodeURIComponent(
    fileName
  )}`;

  // Always show file name and clickable link
  doc.text(`File: ${fileName}`);
  doc
    .fillColor("blue")
    .text("Click here to download", { link: downloadUrl, underline: true })
    .fillColor("black");

  // Optionally embed a small image preview if the attachment is an image
  if (isImageAttachment(attachment)) {
    try {
      const buf = bufferFromBase64(attachment.base64);
      doc.image(buf, { fit: [250, 150] });
    } catch (e) {
      // Ignore preview errors; link above is sufficient
    }
  }

  doc.moveDown(0.5);
}

exports.downloadCandidatePDF = async (req, res) => {
  try {
    const { id } = req.params;

    let candidate = await OnboardedCandidate.findOne({ draftId: id });
    if (!candidate) {
      try {
        candidate = await OnboardedCandidate.findById(id);
      } catch (_) {}
    }

    if (!candidate)
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Candidate_${id}.pdf"`
    );

    doc.pipe(res);

    // ------------------------------------------------------------------
    // Helper values
    // ------------------------------------------------------------------
    const pageWidth = doc.page.width;
    const left = doc.page.margins.left;
    const right = doc.page.margins.right;
    const usableWidth = pageWidth - left - right;
    const bottomY = doc.page.height - doc.page.margins.bottom;

    const safeDecrypt = (val) => {
      if (!val) return "";
      try {
        return decryptText(val);
      } catch (e) {
        console.error("Decrypt error:", e.message);
        return "";
      }
    };

    function ensureSpace(h) {
      if (doc.y + h > bottomY) {
        doc.addPage();
      }
    }

    function drawSectionHeader(title) {
      const headerHeight = 24;
      ensureSpace(headerHeight + 6);
      const x = left;
      const y = doc.y;
      doc.save();
      doc.rect(x, y, usableWidth, headerHeight).fill("#eaeef5");
      doc.restore();
      doc.fillColor("#000").font("Helvetica-Bold").fontSize(14);
      doc.text(title, x + 8, y + 6);
      doc
        .moveTo(x, y + headerHeight)
        .lineTo(x + usableWidth, y + headerHeight)
        .strokeColor("#d0d7e2")
        .lineWidth(0.8)
        .stroke();
      doc.y = y + headerHeight + 6;
      doc.fillColor("#000").font("Helvetica");
    }

    function buildDownloadUrl(sectionKey, fileName) {
  const baseUrl =
    process.env.PUBLIC_WEB_URL ||
    "https://offer-documentation.onrender.com";

  const cid = candidate.draftId || candidate._id;

  return `${baseUrl}/api/candidate/${cid}/${sectionKey}/${encodeURIComponent(
    fileName
  )}`;
}

    function drawKeyValueTable(rows, opts = {}) {
      const col1Width = Math.min(Math.floor(usableWidth * 0.38), 220);
      const col2Width = usableWidth - col1Width;
      const pad = 6;

      rows.forEach((row) => {
        const label = row.label || "";
        const valueObj = row.value;
        const valueText =
          typeof valueObj === "object" && valueObj !== null
            ? valueObj.text || ""
            : valueObj ?? "";
        const valueLink =
          typeof valueObj === "object" && valueObj !== null
            ? valueObj.link
            : undefined;

        const labelHeight = doc.heightOfString(String(label), {
          width: col1Width - pad * 2,
        });
        const valueHeight = doc.heightOfString(String(valueText), {
          width: col2Width - pad * 2,
        });
        const rowH = Math.max(labelHeight, valueHeight) + pad * 2;

        ensureSpace(rowH + 2);

        const x = left;
        const y = doc.y;

        // Borders
        doc
          .save()
          .lineWidth(0.5)
          .strokeColor("#C7CDD6")
          .rect(x, y, col1Width, rowH)
          .stroke()
          .rect(x + col1Width, y, col2Width, rowH)
          .stroke()
          .restore();

        // Label
        doc.font("Helvetica-Bold").fillColor("#111");
        doc.text(String(label), x + pad, y + pad, {
          width: col1Width - pad * 2,
        });

        // Value (with optional link)
        doc.font("Helvetica").fillColor("#000");
        if (valueLink) {
          doc
            .fillColor("blue")
            .text(String(valueText), x + col1Width + pad, y + pad, {
              width: col2Width - pad * 2,
              link: valueLink,
              underline: true,
            })
            .fillColor("#000");
        } else {
          doc.text(String(valueText), x + col1Width + pad, y + pad, {
            width: col2Width - pad * 2,
          });
        }

        doc.y = y + rowH;
      });

      doc.moveDown(0.5);
    }

    function attachmentValue(att, sectionKey) {
      // FIX: don't depend on base64; check fileName
      if (!att || !att.fileName) return "None";
      const fileName = att.fileName || "Attachment";
      return { text: fileName, link: buildDownloadUrl(sectionKey, fileName) };
    }

    // ------------------------------------------------------------------
    // BASIC INFORMATION
    // ------------------------------------------------------------------
    drawSectionHeader("Basic Information");

    const b = candidate.basicInfo || candidate.basic || {};

    // Try decrypt first, then fall back to multiple possible keys
    const aadharNum =
  safeDecrypt(b.aadharEncrypted) ||
  b.aadharNumber ||
  b.encryptedAadhar ||
  candidate.basicInfo?.aadharNumber ||
  "";

const panNum =
  safeDecrypt(b.panEncrypted) ||
  b.panNumber ||
  b.encryptedPan ||
  candidate.basicInfo?.panNumber ||
  "";

    drawKeyValueTable([
      { label: "Salutation", value: b.salutation || "" },
      {
        label: "Name",
        value: `${b.firstName || ""} ${b.lastName || ""}`.trim(),
      },
      { label: "Email", value: b.email || "" },
      {
        label: "Phone",
        value: `${b.countryCode || ""} ${b.phoneNumber || ""}`.trim(),
      },
      { label: "Father Name", value: b.fatherName || "" },
      { label: "Gender", value: b.gender || "" },
      { label: "Aadhar Number", value: aadharNum },
      { label: "PAN Number", value: panNum },

      {
        label: "Aadhar Attachment",
        value: attachmentValue(b.aadharAttachment, "basicInfo"),
      },
      {
        label: "PAN Attachment",
        value: attachmentValue(b.panAttachment, "basicInfo"),
      },
    ]);

    // ------------------------------------------------------------------
    // QUALIFICATION DETAILS
    // ------------------------------------------------------------------
    drawSectionHeader("Qualification Details");

    const qualification =
      candidate.qualification || candidate.qualifications || {};

    const eduArray = Array.isArray(qualification.education)
      ? qualification.education
      : Array.isArray(candidate.education)
      ? candidate.education
      : Array.isArray(qualification)
      ? qualification
      : [];

    if (eduArray.length === 0) {
      drawKeyValueTable([
        { label: "Details", value: "No qualification records" },
      ]);
    } else {
      eduArray.forEach((edu, index) => {
        ensureSpace(26);
        doc.font("Helvetica-Bold").fontSize(12).text(`Education ${index + 1}`);
        doc.moveDown(0.2);

        const degree =
          edu.qualification || edu.degree || edu.course || edu.std || "";
        const specialization =
          edu.specialization ||
          edu.subbranch ||
          edu.spec ||
          edu.branch ||
          "";
        const percentage =
          edu.percentage || edu.percent || edu.marks || edu.score || "";
        const passingYear =
          edu.passingYear ||
          edu.yearPassing ||
          edu.yearOfPassing ||
          edu.passing_year ||
          edu.year ||
          "";

        drawKeyValueTable([
          { label: "Degree", value: degree },
          { label: "Specialization", value: specialization },
          { label: "Percentage", value: String(percentage) },
          { label: "Passing Year", value: String(passingYear) },
          {
            label: "Certificate",
            value: attachmentValue(
              edu.certificateAttachment || edu.certificate || edu.attachment,
              "qualification"
            ),
          },
        ]);
      });
    }

    // ------------------------------------------------------------------
    // OFFER DETAILS
    // ------------------------------------------------------------------
    drawSectionHeader("Offer Details");

    const offer =
      candidate.offerDetails || candidate.offer || candidate.offerInfo || {};

    const offerDate =
      offer.offerDate || offer.dateOfOffer || offer.offer_date || "";
    const joiningDate =
      offer.dateOfJoining || offer.joiningDate || offer.doj || "";
    const empId =
      offer.employeeId || offer.empId || offer.employeeCode || "";

    drawKeyValueTable([
      { label: "Offer Date", value: offerDate },
      { label: "Date of Joining", value: joiningDate },
      { label: "Employee ID", value: empId },
      { label: "Interview Remarks", value: offer.interviewRemarks || "" },
      {
        label: "Offer Letter",
        value: attachmentValue(
          offer.offerLetterAttachment || offer.offerLetter,
          "offerDetails"
        ),
      },
    ]);

    // ------------------------------------------------------------------
    // BANK DETAILS
    // ------------------------------------------------------------------
    drawSectionHeader("Bank Details");

    const bank =
      candidate.bankDetails || candidate.bank || candidate.bankInfo || {};

    const accountNumber =
      safeDecrypt(bank.accountEncrypted) ||
      bank.accountNumber ||
      bank.accNumber ||
      bank.account_no ||
      "";

    const ifsc =
      safeDecrypt(bank.ifscEncrypted) ||
      bank.ifsc ||
      bank.ifscCode ||
      bank.ifsc_code ||
      "";

    drawKeyValueTable([
      { label: "Bank Name", value: bank.bankName || "" },
      { label: "Branch", value: bank.branchName || bank.branch || "" },
      { label: "Account Number", value: accountNumber || "Not Available" },
      { label: "IFSC Code", value: ifsc || "Not Available" },
      {
        label: "Bank Proof",
        value: attachmentValue(
          bank.bankAttachment || bank.attachment || bank.proofAttachment,
          "bankDetails"
        ),
      },
    ]);

    // ------------------------------------------------------------------
// EMPLOYMENT DETAILS
// ------------------------------------------------------------------
drawSectionHeader("Employment Details");

const emp = candidate.employmentDetails || {};
const experiences = Array.isArray(emp.experiences) ? emp.experiences : [];
const empType = emp.employmentType || (experiences.length ? "Experience" : "Fresher");

if (empType === "Fresher") {
  drawKeyValueTable([
    { label: "Employment Type", value: empType },
    { label: "Role Hired", value: emp.hiredRole || "" },
    { label: "Offered CTC", value: emp.fresherCtc || "" },
    { label: "General Remarks", value: emp.generalRemarks || "" },
    {
      label: "Offer Letter",
      value: attachmentValue(emp.offerLetterAttachment, "employmentDetails"),
    }
  ]);
}

// Experience Case: Show each field separately and clearly in rows
if (empType === "Experience") {
  const exp = experiences[0];

  drawKeyValueTable([
    { label: "Employment Type", value: empType },
    { label: "Company Name", value: exp?.companyName || "" },
   { label: "Joined CTC", value: exp.joiningCTC || exp.joinedCtc || "" },
   { label: "Offered CTC", value: exp.offeredCTC || exp.offeredCtc || "" },
    { label: "Duration From", value: exp?.durationFrom || "" },
    { label: "Duration To", value: exp?.durationTo || "" },
    { label: "Reason for Leaving", value: exp?.experienceRemarks || "" },
    {
      label: "General Remarks",
      value: exp?.experienceRemarks || emp.generalRemarks || ""
    },
    {
      label: "Offer Letter",
      value: attachmentValue(exp?.offerLetterAttachment, "employmentDetails"),
    }
  ]);

  // Payslips, each in its own row
  if (Array.isArray(exp?.payslipAttachments)) {
    exp.payslipAttachments.forEach((p, i) => {
      drawKeyValueTable([
        {
          label: `Payslip ${i + 1}`,
          value: attachmentValue(p, "employmentDetails")
        }
      ]);
    });
  }
}

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate candidate PDF",
      error: err.message,
    });
  }
};



exports.viewCandidateDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID or draftId is required",
      });
    }

    // Try finding by draftId first
    let candidate = await OnboardedCandidate.findOne({ draftId: id });

    // If not found → try MongoDB _id
    if (!candidate) {
      try {
        candidate = await OnboardedCandidate.findById(id);
      } catch (err) {}
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // Augment with UI fields without changing storage
    const data = candidate.toObject ? candidate.toObject() : JSON.parse(JSON.stringify(candidate));
    const b = data.basicInfo || {};
    const bank = data.bankDetails || {};

    const aadharDecrypted = b.aadharEncrypted ? decryptText(b.aadharEncrypted) : null;
    const panDecrypted = b.panEncrypted ? decryptText(b.panEncrypted) : null;
    const accountDecrypted = bank.accountEncrypted ? decryptText(bank.accountEncrypted) : null;
    const ifscDecrypted = bank.ifscEncrypted ? decryptText(bank.ifscEncrypted) : null;

    if (!data.basicInfo) data.basicInfo = {};
    data.basicInfo.aadhar_number = aadharDecrypted || null;
    data.basicInfo.pan_number = panDecrypted || null;

    if (!data.bankDetails) data.bankDetails = {};
    data.bankDetails.account_number = accountDecrypted || null;
    data.bankDetails.ifsc_number = ifscDecrypted || null;

    return res.status(200).json({
      success: true,
      message: "Candidate details fetched successfully",
      data,
    });
  } catch (error) {
    console.error("View Candidate Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch candidate details",
      error: error.message,
    });
  }
};
