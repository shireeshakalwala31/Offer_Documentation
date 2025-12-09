const jwt = require("jsonwebtoken");
const HrAdmin = require("../models/Admin");
const EmployeeUser = require("../models/EmployeeUser"); // <-- Login users for onboarding

exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token header" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 1️⃣ Validate Admin User
    let user = await HrAdmin.findById(decoded.id).select("-password");
    if (user) {
      req.user = user;
      req.role = "admin";
      return next();
    }

    // 2️⃣ Validate Employee User
    user = await EmployeeUser.findById(decoded.id).select("-password");
    if (user) {
      req.user = user;
      req.role = "employee";
      return next();
    }

    return res.status(401).json({ message: "User not found or unauthorized" });
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(401).json({
      message: "Invalid or expired token",
      error: error.message
    });
  }
};

// Only Admin (Offer, Appointment, Relieving, Office Use, Final Merge)
exports.adminOnly = (req, res, next) => {
  if (req.role === "admin") return next();
  return res.status(403).json({ message: "Admin access required" });
};

// Only Employee (Personal, PF, Family, Experience, Declaration)
exports.employeeOnly = (req, res, next) => {
  if (req.role === "employee") return next();
  return res.status(403).json({ message: "Employee access required" });
};

// Both Admin + Employee (Get Self / View)
exports.adminOrEmployee = (req, res, next) => {
  if (req.role === "admin" || req.role === "employee") return next();
  return res.status(403).json({ message: "Access denied" });
};
