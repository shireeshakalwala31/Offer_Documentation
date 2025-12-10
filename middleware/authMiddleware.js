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

    console.log("Decoded Token =>", decoded);

    // Identify user type
    let user = null;

    if (decoded.role === "admin") {
      user = await HrAdmin.findById(decoded.id).select("-password");
    } else if (decoded.role === "employee") {
      user = await Employee.findById(decoded.id).select("-password");
    }

    if (!user) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    req.user = user;
    req.role = decoded.role;
    next();

  } catch (error) {
    console.error("Token error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Only Admin can access HR features
exports.adminOnly = (req, res, next) => {
  if (req.user?.role?.toLowerCase() === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Admin only" });
};

