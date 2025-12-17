const bcrypt = require("bcryptjs");
const HrAdmin = require("../models/Admin");

async function createDefaultAdmin() {
  try {
    const existingAdmin = await HrAdmin.findOne({ email: "lufrurefrowa-6424@yopmail.com" });

    if (existingAdmin) {
      console.log("✔ Admin already exists. Skipping admin creation.");
      return;
    }

    const hashedPassword = await bcrypt.hash("Admin@1234", 10);

    const admin = new HrAdmin({
      firstName: "SUPER",
      lastName: "ADMIN",
      email: "lufrurefrowa-6424@yopmail.com",
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();

    console.log("✔ Default Admin Created:");
    console.log("Email: admin@company.com");
    console.log("Password: Admin@123");

  } catch (err) {
    console.error("Admin seeding failed:", err);
  }
}

module.exports = createDefaultAdmin;
