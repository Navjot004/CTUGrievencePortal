// models/AdminStaffModel.js
import mongoose from "mongoose";

const adminStaffSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    enum: ["Accounts", "Admission", "Student Welfare", "Examination"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate (same staffId + same department)
adminStaffSchema.index({ staffId: 1, department: 1 }, { unique: true });

const AdminStaff =
  mongoose.models.AdminStaff || mongoose.model("AdminStaff", adminStaffSchema);

export default AdminStaff;
