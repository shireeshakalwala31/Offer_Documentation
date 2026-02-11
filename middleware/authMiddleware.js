const jwt = require("jsonwebtoken");
const HrAdmin = require("../models/Admin");
const EmployeeUser = require("../models/onboarding/EmployeeUser");

exports.verifyToken = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;

    if (decoded.role === "admin") {
      user = await HrAdmin.findById(decoded.id).select("-password");
      req.admin = user;
    } else if (decoded.role === "employee") {
      user = await EmployeeUser.findById(decoded.id).select("-password");
      req.employee = user;
    } else if (decoded.role === "onboarding") {
      // For onboarding users, no DB lookup needed, use decoded data
      user = { email: decoded.email, role: "onboarding" };
      req.onboarding = user;
    }

    if (!user) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    req.user = user;
    req.role = decoded.role;

    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Admin Only
exports.adminOnly = (req, res, next) => {
  if (req.role === "admin" || req.role === "superAdmin") return next();
  return res.status(403).json({ message: "Access denied: Admin only" });
};

// Employee Only
exports.employeeOnly = (req, res, next) => {
  if (req.role === "employee" || req.role === "onboarding") return next();
  return res.status(403).json({ message: "Access denied: Employee only" });
};
