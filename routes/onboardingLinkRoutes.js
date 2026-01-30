const express = require("express");
const router = express.Router();
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

const {
  generateOnboardingLink,
  validateLink,
  saveSection,
  submitDeclaration,
  getProgress,
  getAllOnboardingLinks,
  employeeLoginOrRegister,
  validateOnboardingToken
} = require("../controllers/onboardingLinkController");

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

/**
 * @route   POST /api/onboarding-link/generate
 * @desc    Generate onboarding link for a candidate
 * @access  Admin only
 */
router.post(
  "/generate",
  verifyToken,
  adminOnly,
  generateOnboardingLink
);

/**
 * @route   GET /api/onboarding-link/all
 * @desc    Get all onboarding links with progress
 * @access  Admin only
 */
router.get(
  "/all",
  verifyToken,
  adminOnly,
  getAllOnboardingLinks
);

// ============================================
// PUBLIC ROUTES (Token-based access)
// ============================================

/**
 * @route   GET /api/onboarding-link/check/:token
 * @desc    Check if onboarding token is valid (NO LOGIN REQUIRED)
 * @access  Public
 */
router.get(
  "/check/:token",
  validateOnboardingToken
);

/**
 * @route   POST /api/onboarding-link/login
 * @desc    Employee login or register for onboarding
 * @access  Public
 * @body    { token, email, password }
 */
router.post(
  "/login",
  employeeLoginOrRegister
);

/**
 * @route   GET /api/onboarding-link/validate/:token
 * @desc    Validate link and get progress (returns existing data if any)
 * @access  Public (token required)
 */
router.get(
  "/validate/:token",
  validateLink
);

/**
 * @route   GET /api/onboarding-link/progress/:token
 * @desc    Get current progress status
 * @access  Public (token required)
 */
router.get(
  "/progress/:token",
  getProgress
);

/**
 * @route   POST /api/onboarding-link/save/:token/:section
 * @desc    Save individual section (partial save)
 * @access  Public (token required)
 * @params  section: personal | pf | academic | experience | family | declaration
 */
router.post(
  "/save/:token/:section",
  saveSection
);

/**
 * @route   POST /api/onboarding-link/submit-declaration/:token
 * @desc    Submit declaration (FINAL STEP - expires link)
 * @access  Public (token required)
 */
router.post(
  "/submit-declaration/:token",
  submitDeclaration
);

module.exports = router;
