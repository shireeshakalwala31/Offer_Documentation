const mongoose = require("mongoose");

const EmployeeUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["employee"],
      default: "employee"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployeeUser", EmployeeUserSchema);
