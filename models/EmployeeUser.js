const mongoose = require("mongoose");

const EmployeeUserSchema = new mongoose.Schema({
  employeeMasterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EmployeeMaster",
    required: true
  },
  employeeCode: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "employee"
  }
}, { timestamps: true });

module.exports = mongoose.model("EmployeeUser", EmployeeUserSchema);
