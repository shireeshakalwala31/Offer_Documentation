const mongoose = require("mongoose");

const EmployeeUserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      default: "employee"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployeeUser", EmployeeUserSchema);
