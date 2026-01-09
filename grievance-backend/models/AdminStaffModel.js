const mongoose = require("mongoose");

const AdminStaffSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true, // Staff ID (e.g., 25002)
  },
  fullName: {
    type: String,
    required: true,
  },
  // ✅ Ye field zaroori hai nayi hierarchy ke liye
  adminDepartment: {
    type: String,
    default: "", // e.g., "Student Welfare"
  },
  // ✅ Ye sabse important hai: Batayega ki banda BOSS hai ya WORKER
  isDeptAdmin: {
    type: Boolean,
    default: false, 
  }
}, { timestamps: true });

module.exports = mongoose.model("AdminStaff", AdminStaffSchema);