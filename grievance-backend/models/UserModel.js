import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  role: { type: String, enum: ["student", "staff", "admin"], required: true },
  fullName: String,
  email: { type: String, required: true, unique: true },
  phone: String,
  password: { type: String, required: true },
  program: String,
  studentType: String,
  isVerified: { type: Boolean, default: false }, // OTP verification ke liye
  otp: String,
  otpExpires: Date,
  staffDepartment: { type: String, default: "" },
  isDeptAdminStaff: { type: Boolean, default: false }
});

// ✅ SABSE ZAROORI: Export default zaroor add karein
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;