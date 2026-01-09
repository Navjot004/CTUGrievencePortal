import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Basic Identity
  id: { type: String, required: true, unique: true }, // RegID / StaffID / AdminID
  role: { type: String, enum: ["student", "staff", "admin"], required: true },

  // Personal Info
  fullName: { type: String },
  email: { type: String, required: true,  }, // "unique: true" add this if you dont want same email registrations
  phone: { type: String },

  // Auth
  password: { type: String, required: true },

  // OTP & Verification
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Number },

  // Student Info
  program: String,
  studentType: String,

  // Admin / Staff Info
  isDeptAdmin: { type: Boolean, default: false },
  adminDepartment: { type: String, default: "" },

}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
