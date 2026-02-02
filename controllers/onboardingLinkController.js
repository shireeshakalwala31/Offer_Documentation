const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const OnboardingLink = require("../models/OnboardingLink");
const OnboardingProgress = require("../models/OnboardingProgress");
const EmployeeMaster = require("../models/onboarding/EmployeeMaster");
const EmployeeUser = require("../models/onboarding/EmployeeUser");
const TempPersonal = require("../models/onboarding/TempPersonal");
const TempPF = require("../models/onboarding/TempPF");
const TempAcademic = require("../models/onboarding/TempAcademic");
const TempExperience = require("../models/onboarding/TempExperience");
const TempFamily = require("../models/onboarding/TempFamily");
const TempDeclaration = require("../models/onboarding/TempDeclaration");
const sendEmail = require("../services/emailService");

/**
 * Helper: Get clean backend API base URL
 */
function getBackendApiUrl(res) {
  const apiUrl = process.env.BACKEND_API_URL?.trim();

  if (!apiUrl) {
    res.status(500).json({
      success: false,
      message: "BACKEND_API_URL is missing in backend environment"
    });
    return null;
  }

  return apiUrl;
}

/**
 * Helper: Get clean frontend base URL
 */
function getFrontendBaseUrl(res) {
  const baseUrl = process.env.PUBLIC_WEB_URL?.trim();

  if (!baseUrl) {
    res.status(500).json({
      success: false,
      message: "PUBLIC_WEB_URL is missing in backend environment"
    });
    return null;
  }

  return baseUrl;
}

// ============================================
// 1. GENERATE ONBOARDIBACKEND_API_URL=https://offer-documentation.onrender.com
// ============================================
exports.generateOnboardingLink = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required"
      });
    }

    const frontendUrl = getFrontendBaseUrl(res);
if (!frontendUrl) return;


    // Check for existing active link
    const existingLink = await OnboardingLink.findOne({
      email,
      isExpired: false
    });

    if (existingLink) {
      return res.status(200).json({
        success: true,
        message: "Active onboarding link already exists for this email",
        token: existingLink.token,
        url: `${frontendUrl}/onboarding/${existingLink.token}/login`,
        email: existingLink.email,
        firstName: existingLink.firstName,
        lastName: existingLink.lastName,
        password: existingLink.password
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Generate one-time password (6 alphanumeric characters)
    const password = crypto.randomBytes(4).toString("hex").substring(0, 8).toUpperCase();

    // Create link with auto-generated password
    await OnboardingLink.create({
      email,
      firstName,
      lastName,
      token,
      password,
      isExpired: false,
      generatedBy: req.admin?._id || null,
      expiresAt: null
    });

    // Create draft
    const draftId = `DRAFT-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    await OnboardingProgress.create({
      token,
      draftId,
      email,
      firstName,
      lastName,
      currentSection: "personal"
    });

    await EmployeeMaster.create({
      draftId,
      status: "draft"
    });

    const onboardingUrl = `${frontendUrl}/onboarding/${token}/login`;



    // Send email with password (non-blocking)
    try {
      await sendEmail({
        to: email,
        subject: "Your Onboarding Link & Login Credentials",
        html: `
          <p>Dear ${firstName} ${lastName},</p>
          <p>Your onboarding has been initiated. Please use the following credentials to access your onboarding:</p>
          
          <h3>Onboarding Link:</h3>
          <a href="${onboardingUrl}" style="color: #1976d2; text-decoration: none; font-weight: bold;">
            ${onboardingUrl}
          </a>
          
          <h3>Login Credentials:</h3>
          <p>
            <strong>Email:</strong> ${email}<br>
            <strong>Password:</strong> <code style="background: #f0f0f0; padding: 5px; font-family: monospace;">${password}</code>
          </p>
          
          <p style="color: #666; font-size: 12px;">
            This link remains active until you complete all sections of the onboarding form.
            You can save your progress and resume later.
          </p>
          
          <p>Best regards,<br>HR Team</p>
        `
      });
    } catch (err) {
      console.error("Email failed:", err.message);
    }

    return res.status(201).json({
      success: true,
      message: "Onboarding link generated successfully",
      token,
      url: onboardingUrl,
      email,
      firstName,
      lastName,
      password,
      draftId,
      instructions: "Share the URL and password with the candidate via email"
    });
  } catch (error) {
    console.error("Generate Link Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate onboarding link",
      error: error.message
    });
  }
};

// ============================================
// 2. VALIDATE LINK & GET PROGRESS
// ============================================
exports.validateLink = async (req, res) => {
  try {
    const { token } = req.params;

    const link = await OnboardingLink.findOne({ token });
    if (!link) {
      return res.status(404).json({ success: false, message: "Invalid onboarding link" });
    }

    if (link.isExpired) {
      return res.status(400).json({
        success: false,
        message: "This onboarding link has expired",
        isExpired: true
      });
    }

    const progress = await OnboardingProgress.findOne({ token });
    if (!progress) {
      return res.status(404).json({ success: false, message: "Progress not found" });
    }

    const existingData = {
      personal: await TempPersonal.findOne({ draftId: progress.draftId }),
      pf: await TempPF.findOne({ draftId: progress.draftId }),
      academic: await TempAcademic.findOne({ draftId: progress.draftId }),
      experience: await TempExperience.findOne({ draftId: progress.draftId }),
      family: await TempFamily.findOne({ draftId: progress.draftId }),
      declaration: await TempDeclaration.findOne({ draftId: progress.draftId })
    };

    return res.status(200).json({
      success: true,
      isExpired: false,
      draftId: progress.draftId,
      email: link.email,
      progress: {
        ...progress.toObject(),
        completionPercentage: progress.getCompletionPercentage(),
        nextSection: progress.getNextSection()
      },
      existingData
    });

  } catch (error) {
    console.error("Validate Link Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate link",
      error: error.message
    });
  }
};


// ============================================
// 3. SAVE SECTION (PARTIAL SAVE)
// ============================================
exports.saveSection = async (req, res) => {
  try {
    const { token, section } = req.params;
    const sectionData = req.body;

    if (!token || !section) {
      return res.status(400).json({
        success: false,
        message: "Token and section are required"
      });
    }

    // Validate section name
    const validSections = ["personal", "pf", "academic", "experience", "family", "declaration"];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section. Must be one of: ${validSections.join(", ")}`
      });
    }

    // Check if link is valid
    const link = await OnboardingLink.findOne({ token });
    if (!link || link.isExpired) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired link"
      });
    }

    // Get progress
    const progress = await OnboardingProgress.findOne({ token });
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress record not found"
      });
    }

    // Map section to model
    const sectionModelMap = {
      personal: TempPersonal,
      pf: TempPF,
      academic: TempAcademic,
      experience: TempExperience,
      family: TempFamily,
      declaration: TempDeclaration
    };

    const Model = sectionModelMap[section];
    const draftId = progress.draftId;

    // Save or update section data
    let record = await Model.findOne({ draftId });
    
    if (!record) {
      record = new Model({ draftId, ...sectionData });
    } else {
      Object.assign(record, sectionData);
    }

    await record.save();

    // Update progress
    progress[section].completed = true;
    progress[section].completedAt = new Date();
    
    // Update current section to next incomplete one
    progress.currentSection = progress.getNextSection() || "declaration";
    
    await progress.save();

    // Sync to EmployeeMaster
    const sectionFieldMap = {
      personal: "personal",
      pf: "pfDetails",
      academic: "academicDetails",
      experience: "experienceDetails",
      family: "familyDetails",
      declaration: "declarationDetails"
    };

    await EmployeeMaster.findOneAndUpdate(
      { draftId },
      { $set: { [sectionFieldMap[section]]: record.toObject() } },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `${section} section saved successfully`,
      section,
      completed: true,
      nextSection: progress.getNextSection(),
      completionPercentage: progress.getCompletionPercentage(),
      data: record
    });

  } catch (error) {
    console.error("Save Section Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save section",
      error: error.message
    });
  }
};

// ============================================
// 4. SUBMIT DECLARATION (FINAL STEP - EXPIRES LINK)
// ============================================
exports.submitDeclaration = async (req, res) => {
  try {
    const { token } = req.params;
    const declarationData = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required"
      });
    }

    // Check if link is valid
    const link = await OnboardingLink.findOne({ token });
    if (!link || link.isExpired) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired link"
      });
    }

    // Get progress
    const progress = await OnboardingProgress.findOne({ token });
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress record not found"
      });
    }

    // Check if all other sections are completed
    if (!progress.personal.completed || 
        !progress.pf.completed || 
        !progress.academic.completed || 
        !progress.experience.completed || 
        !progress.family.completed) {
      return res.status(400).json({
        success: false,
        message: "Please complete all previous sections before submitting declaration",
        missingSection: progress.getNextSection()
      });
    }

    const draftId = progress.draftId;

    // Save declaration data
    let declaration = await TempDeclaration.findOne({ draftId });
    if (!declaration) {
      declaration = new TempDeclaration({ draftId, ...declarationData });
    } else {
      Object.assign(declaration, declarationData);
    }
    await declaration.save();

    // Update progress - mark declaration as completed
    progress.declaration.completed = true;
    progress.declaration.completedAt = new Date();
    progress.isFullyCompleted = true;
    progress.completedAt = new Date();
    progress.currentSection = "declaration";
    await progress.save();

    // Update EmployeeMaster
    await EmployeeMaster.findOneAndUpdate(
      { draftId },
      { 
        $set: { 
          declarationDetails: declaration.toObject(),
          status: "submitted",
          submittedAt: new Date()
        } 
      }
    );

    // 🔥 EXPIRE THE LINK (THIS IS THE KEY PART)
    link.isExpired = true;
    await link.save();

    return res.status(200).json({
      success: true,
      message: "Onboarding completed successfully! Your link has been expired.",
      isFullyCompleted: true,
      completionPercentage: 100,
      submittedAt: new Date(),
      draftId
    });

  } catch (error) {
    console.error("Submit Declaration Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit declaration",
      error: error.message
    });
  }
};

// ============================================
// 5. GET PROGRESS (OPTIONAL - FOR CHECKING STATUS)
// ============================================
exports.getProgress = async (req, res) => {
  try {
    const { token } = req.params;

    const progress = await OnboardingProgress.findOne({ token });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress not found"
      });
    }

    const link = await OnboardingLink.findOne({ token });

    return res.status(200).json({
      success: true,
      progress: {
        personal: progress.personal,
        pf: progress.pf,
        academic: progress.academic,
        experience: progress.experience,
        family: progress.family,
        declaration: progress.declaration,
        isFullyCompleted: progress.isFullyCompleted,
        currentSection: progress.currentSection,
        completionPercentage: progress.getCompletionPercentage(),
        nextSection: progress.getNextSection()
      },
      isExpired: link?.isExpired || false,
      email: progress.email,
      draftId: progress.draftId
    });

  } catch (error) {
    console.error("Get Progress Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get progress",
      error: error.message
    });
  }
};

// ============================================
// 6. GET ALL ONBOARDING LINKS (ADMIN VIEW)
// ============================================
exports.getAllOnboardingLinks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "all" } = req.query;

    let filter = {};
    if (status === "active") {
      filter.isExpired = false;
    } else if (status === "expired") {
      filter.isExpired = true;
    }

    const total = await OnboardingLink.countDocuments(filter);
    
    const links = await OnboardingLink.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("generatedBy", "name email");

    // Get progress for each link
    const linksWithProgress = await Promise.all(
      links.map(async (link) => {
        const progress = await OnboardingProgress.findOne({ token: link.token });
        return {
          ...link.toObject(),
          progress: progress ? {
            completionPercentage: progress.getCompletionPercentage(),
            currentSection: progress.currentSection,
            isFullyCompleted: progress.isFullyCompleted
          } : null
        };
      })
    );

    return res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      data: linksWithProgress
    });

  } catch (error) {
    console.error("Get All Links Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch onboarding links",
      error: error.message
    });
  }
};

// ============================================
// 7. EMPLOYEE LOGIN (SIMPLE PASSWORD VALIDATION)
// ============================================
exports.employeeLoginOrRegister = async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Token, email, and password are required"
      });
    }

    // Validate onboarding link
    const link = await OnboardingLink.findOne({ token });
    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Invalid onboarding link"
      });
    }

    if (link.isExpired) {
      return res.status(400).json({
        success: false,
        message: "This onboarding link has expired. Please contact HR."
      });
    }

    // Email must match the link
    if (email.toLowerCase().trim() !== link.email.toLowerCase().trim()) {
      return res.status(400).json({
        success: false,
        message: "Email does not match the onboarding link"
      });
    }

    // Validate password - simple string comparison
    if (password !== link.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password. Please check the password sent to your email."
      });
    }

    // Password is correct - generate JWT token for this session
    const jwtToken = jwt.sign(
      {
        token: token,
        email: email,
        role: "onboarding"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: jwtToken,
      candidate: {
        email: link.email,
        firstName: link.firstName,
        lastName: link.lastName
      },
      onboardingToken: token
    });

  } catch (error) {
    console.error("Employee Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error.message
    });
  }
};

// ============================================
// 8. VALIDATE ONBOARDING TOKEN (NO AUTH REQUIRED)
// ============================================
exports.validateOnboardingToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Check if onboarding link exists and is valid
    const link = await OnboardingLink.findOne({ token });
    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Invalid onboarding link",
        isValid: false
      });
    }

    if (link.isExpired) {
      return res.status(400).json({
        success: false,
        message: "This onboarding link has expired",
        isValid: false,
        isExpired: true
      });
    }

    // Return link info without requiring login
    return res.status(200).json({
      success: true,
      isValid: true,
      isExpired: false,
      email: link.email,
      firstName: link.firstName,
      lastName: link.lastName,
      message: "Please login to continue with onboarding"
    });

  } catch (error) {
    console.error("Validate Token Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate token",
      error: error.message,
      isValid: false
    });
  }
};
