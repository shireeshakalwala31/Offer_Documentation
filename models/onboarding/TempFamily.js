const mongoose = require("mongoose");

const familySchema = new mongoose.Schema({
  draftId: { type: String, required: true },

  // For table ordering
  serialNo: Number,

  name: {
    type: String,
    required: true
  },
  relation: {
    type: String,
    required: true
  },
  dobOrAge: String,
  bloodGroup: String,
  occupation: String

}, { timestamps: true });

module.exports = mongoose.model("TempFamily", familySchema);
