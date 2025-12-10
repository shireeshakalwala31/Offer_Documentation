const jwt = require("jsonwebtoken");
const HrAdmin = require("../models/Admin");
const Employee = require("../models/onboarding/EmployeeMaster");

exports.verifyToken = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    let user = null;

    if (decoded.role?.toLowerCase() === "admin") {
      user = await HrAdmin.findById(userId).select("-password");
    } else if (decoded.role?.toLowerCase() === "employee") {
      user = await Employee.findById(userId).select("-password");
    }

    if (!user) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    req.user = user;
    req.role = decoded.role;
    next();

  } catch (error) {
    console.error("Token error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user?.role?.toLowerCase() === "admin") return next();
  return res.status(403).json({ message: "Access denied: Admin only" });
};

exports.employeeOrAdmin = (req, res, next) => {
  if (req.user?.role?.toLowerCase() === "admin" 
    || req.user?.role?.toLowerCase() === "employee") return next();
  return res.status(403).json({ message: "Access denied" });
};
