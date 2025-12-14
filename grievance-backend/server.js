import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import twilio from "twilio";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Import modular DB and routes
import connectDB from "./config/db.js";
import grievanceRoutes from "./routes/grievanceRoutes.js";
import adminStaffRoutes from "./routes/adminStaffRoutes.js"; // ✅ NEW

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ------------------ 1️⃣ Express Setup ------------------
const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(bodyParser.json());

// ------------------ 2️⃣ Connect to MongoDB ------------------
connectDB(); // Updated to remove await since connectDB handles it

// ------------------ 3️⃣ Twilio client ------------------
if (!process.env.TWILIO_SID || !process.env.TWILIO_TOKEN) {
  console.warn("⚠️ Twilio credentials not found. SMS will not be sent.");
}
// Only init client if env vars exist to prevent crash
const twilioClient =
  process.env.TWILIO_SID && process.env.TWILIO_TOKEN
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
    : null;

// ------------------ 4️⃣ Define Schemas (Ideally move to /models) ------------------
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  role: { type: String, enum: ["student", "staff", "admin"], required: true },
  fullName: String,
  email: String,
  phone: String,
  password: String,
  program: String, // For students
  staffDepartment: {
  type: String,
  enum: ["Accounts", "Admission", "Examination", "Student Welfare", ""],
  default: ""
},

isDeptAdminStaff: {
  type: Boolean,
  default: false
}

});

const otpSchema = new mongoose.Schema({
  userId: String,
  role: String,
  phone: String,
  otp: String,
  createdAt: Number,
  expiresAt: Number,
});

// Check if model exists before defining to prevent overwrite errors in HMR
const User = mongoose.models.User || mongoose.model("User", userSchema);
const OTP = mongoose.models.OTP || mongoose.model("OTP", otpSchema);

// ------------------ 5️⃣ Health Check ------------------
app.get("/", (req, res) => {
  res.send("✅ Grievance Portal Backend Running (MongoDB + Twilio)");
});

// ------------------ 6️⃣ Register User ------------------
app.post("/api/auth/register", async (req, res) => {
  try {
    // Destructure new fields if any
    const { id, role, fullName, email, phone, password, program, studentType } =
      req.body;

    if (!id || !phone || !password || !role)
      return res.status(400).json({ message: "Missing required fields" });

    // ✅ Validate ID format
    if (role === "admin" && !id.startsWith("ADM"))
      return res
        .status(400)
        .json({ message: "❌ Admin IDs must start with ADM" });
    if (role === "staff" && !id.startsWith("STF"))
      return res
        .status(400)
        .json({ message: "❌ Staff IDs must start with STF" });
    if (role === "student" && !id.startsWith("STU"))
      return res
        .status(400)
        .json({ message: "❌ Student IDs must start with STU" });

    const exists = await User.findOne({ id });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      id: id.toUpperCase(),
      role: role.toLowerCase(),
      fullName,
      email,
      phone,
      password: hashedPassword,
      program, // Optional
      // studentType: studentType // You can add this to schema if you want to save it
    });

    res
      .status(201)
      .json({ message: "✅ Registered successfully", user: newUser });
  } catch (err) {
    console.error("❌ /register:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ------------------ 7️⃣ Request OTP ------------------
app.post("/api/auth/request-otp", async (req, res) => {
  try {
    const { role, id, phone } = req.body;
    if (!role || !id || !phone)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({
      role: role.toLowerCase(),
      id: id.toUpperCase(),
      phone,
    });
    if (!user)
      return res.status(404).json({
        message: "User not found or phone mismatch",
      });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpRecord = await OTP.create({
      userId: id.toUpperCase(),
      role: role.toLowerCase(),
      phone,
      otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    if (twilioClient && process.env.TWILIO_FROM) {
      try {
        await twilioClient.messages.create({
          body: `Your Grievance Portal OTP is ${otp}`,
          from: process.env.TWILIO_FROM,
          to: `+91${phone}`,
        });
        console.log(`✅ OTP sent via Twilio to +91${phone}`);
      } catch (err) {
        console.error("❌ Twilio send error:", err.message);
      }
    } else {
      console.log(`🧩 Mock OTP for ${id}: ${otp}`);
    }

    res.json({ message: "OTP generated", otpId: otpRecord._id });
  } catch (err) {
    console.error("❌ /request-otp:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ------------------ 8️⃣ Verify OTP + Password ------------------
app.post("/api/auth/verify-otp-password", async (req, res) => {
  try {
    const { id, otp, password, role } = req.body;
    if (!id || !otp || !password || !role)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({
      id: id.toUpperCase(),
      role: role.toLowerCase(),
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otpRecord = await OTP.findOne({ userId: id.toUpperCase(), otp });
    if (!otpRecord) return res.status(400).json({ message: "Invalid OTP" });
    if (Date.now() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    await OTP.deleteOne({ _id: otpRecord._id });
    const token = jwt.sign({ id: user.id, role: user.role }, "mock_secret");

    // ✅ Send normalized values
    res.json({
      message: "✅ OTP + Password verified successfully",
      id: user.id.toUpperCase(),
      role: user.role.toLowerCase(),
      token,
    });
  } catch (err) {
    console.error("❌ /verify-otp-password:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ------------------ 9️⃣ NEW: Get User Details (For Auto-fill) ------------------
app.get("/api/auth/user/:id", async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id.toUpperCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Return only safe data
    res.status(200).json({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      program: user.program,
    });
  } catch (err) {
    console.error("❌ /api/auth/user/:id error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ------------------ 🔟 Grievance Routes ------------------
app.use("/api/grievances", grievanceRoutes);

// ------------------ 1️⃣1️⃣ Admin Staff Routes (NEW) ------------------
app.use("/api/admin-staff", adminStaffRoutes);

// ------------------ 1️⃣2️⃣ Start Server ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
