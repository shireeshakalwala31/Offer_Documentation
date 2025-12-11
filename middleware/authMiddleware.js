const jwt = require("jsonwebtoken");
const HrAdmin = require("../models/Admin");
const EmployeeUser = require("../models/onboarding/EmployeeUser");

exports.verifyToken = async (req, res, next) => {
  let token = null;

  // Check Header
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check Query param (for download URLs)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;
    if (decoded.role === "admin") {
      user = await HrAdmin.findById(decoded.id).select("-password");
    }

    if (!user) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};



// Admin Only
exports.adminOnly = (req, res, next) => {
  if (req.role === "admin") return next();
  return res.status(403).json({ message: "Access denied: Admin only" });
};

// Employee Only
exports.employeeOnly = (req, res, next) => {
  if (req.role === "employee") return next();
  return res.status(403).json({ message: "Access denied: Employee only" });
};
