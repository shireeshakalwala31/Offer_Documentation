const jwt = require("jsonwebtoken");
const HrAdmin = require("../models/Admin");
const Employee = require("../models/onboarding/EmployeeMaster");

exports.verifyToken = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if Admin Token
    let user =
      (await HrAdmin.findById(decoded.id).select("-password")) ||
      (await Employee.findById(decoded.id).select("-password"));

    if (!user) {
      return res.status(401).json({ message: "User not found or unauthorized" });
    }

    req.user = user; // Attach authenticated user
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

// Role Based Middleware
exports.adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Admin only" });
  }
};

exports.employeeOrAdmin = (req, res, next) => {
  if (req.user?.role === "employee" || req.user?.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied" });
  }
};
