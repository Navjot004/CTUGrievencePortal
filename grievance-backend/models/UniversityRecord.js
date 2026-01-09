import mongoose from "mongoose";

const universityRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g., STU123, STF001
  fullName: { type: String, required: true },
  email: { type: String, required: true }, // Verification ke liye
  role: { type: String, enum: ["student", "staff", "admin"], required: true },
  department: { type: String, default: "" }, // For Staff
  program: { type: String, default: "" }, // For Students
});

const UniversityRecord = mongoose.model("UniversityRecord", universityRecordSchema);
export default UniversityRecord;