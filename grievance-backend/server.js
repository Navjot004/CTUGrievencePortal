// server.js — Grievance Portal Backend (MongoDB + Twilio + Nodemailer + Manual GridFS)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import twilio from "twilio";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { Readable } from "stream"; // ✅ NEW: Manual streaming ke liye

// ✅ NEW IMPORTS FOR FILE UPLOAD
import Grid from "gridfs-stream";
import multer from "multer";

// Modular DB and routes
import connectDB from "./config/db.js";
import grievanceRoutes from "./routes/grievanceRoutes.js";
import adminStaffRoutes from "./routes/adminStaffRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// ------------------ 1️⃣ Middleware ------------------
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
}));
app.use(express.json()); 

// ------------------ 2️⃣ Database Connection & GridFS Init ------------------
connectDB();

// ✅ GRIDFS SETUP (Manual Stream Mode)
const conn = mongoose.connection;
let gfs, gridfsBucket;

conn.once("open", () => {
  // Init Stream
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads"
  });
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
  console.log("✅ GridFS Initialized (Native Streaming Mode)");
});

// ✅ STORAGE ENGINE (Memory Storage)
// Hum file pehle memory mein lenge, fir manually DB mein stream karenge to fix '_id' error.
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ------------------ 3️⃣ Email Config ------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

// ------------------ 4️⃣ Twilio Config ------------------
const twilioClient = process.env.TWILIO_SID && process.env.TWILIO_TOKEN
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
    : null;

// ------------------ 5️⃣ Schemas & Models ------------------
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  role: { type: String, enum: ["student", "staff", "admin"], required: true },
  fullName: String,
  email: String,
  phone: String,
  password: String,
  program: String,
  studentType: String, 
  staffDepartment: { type: String, default: "" },
  isDeptAdminStaff: { type: Boolean, default: false }
});

const otpSchema = new mongoose.Schema({
  userId: String,
  email: String,
  phone: String,
  otp: String,
  expiresAt: Number,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
const OTP = mongoose.models.OTP || mongoose.model("OTP", otpSchema);

// ------------------ 6️⃣ REGISTRATION ROUTES ------------------

app.post("/api/auth/register-request", async (req, res) => {
  try {
    const { id, email } = req.body;
    const upperId = id.toUpperCase();

    const exists = await User.findOne({ id: upperId });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { userId: upperId, otp, email: email.toLowerCase(), expiresAt: Date.now() + 10 * 60 * 1000 },
      { upsert: true }
    );

    await transporter.sendMail({
      from: `"CT University Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Registration OTP - CT University",
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
                <h2>Welcome to the Grievance Portal</h2>
                <p>Your OTP for registration is: <b style="font-size: 20px; color: #4f46e5;">${otp}</b></p>
                <p>This code is valid for 10 minutes. Do not share it with anyone.</p>
             </div>`,
    });

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Email Error:", err);
    res.status(500).json({ message: "Error sending OTP email" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp, formData } = req.body;

    const otpRecord = await OTP.findOne({ email: email.toLowerCase(), otp });
    if (!otpRecord || Date.now() > otpRecord.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(formData.password, 10);

    const newUser = await User.create({
      id: formData.id.toUpperCase(),
      role: formData.role.toLowerCase(),
      fullName: formData.fullName,
      email: formData.email.toLowerCase(),
      phone: formData.phone,
      password: hashedPassword,
      program: formData.program,
      studentType: formData.studentType 
    });

    await OTP.deleteOne({ _id: otpRecord._id });
    res.status(201).json({ message: "✅ Registered successfully", user: newUser });
  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// ------------------ 7️⃣ LOGIN ROUTES ------------------

app.post("/api/auth/request-otp", async (req, res) => {
  try {
    const { role, id, phone, password } = req.body;
    const user = await User.findOne({ role: role.toLowerCase(), id: id.toUpperCase(), phone });

    if (!user) return res.status(404).json({ message: "User not found or phone mismatch" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpRecord = await OTP.create({
      userId: id.toUpperCase(),
      phone,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    if (twilioClient && process.env.TWILIO_FROM) {
      await twilioClient.messages.create({
        body: `Your Grievance Portal Login OTP is ${otp}`,
        from: process.env.TWILIO_FROM,
        to: `+91${phone}`,
      });
    } else {
      console.log(`🧩 Mock Login OTP for ${id}: ${otp}`);
    }

    res.json({ message: "Password Verified & SMS OTP sent", otpId: otpRecord._id });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/auth/verify-otp-password", async (req, res) => {
  try {
    const { id, otp, password, role } = req.body;
    const user = await User.findOne({ id: id.toUpperCase(), role: role.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otpRecord = await OTP.findOne({ userId: id.toUpperCase(), otp });
    if (!otpRecord || Date.now() > otpRecord.expiresAt) return res.status(400).json({ message: "Invalid/Expired OTP" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    await OTP.deleteOne({ _id: otpRecord._id });
    const token = jwt.sign({ id: user.id, role: user.role }, "mock_secret");

    res.json({ message: "✅ Login success", id: user.id, role: user.role, token });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

app.get("/api/auth/user/:id", async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id.toUpperCase() });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ fullName: user.fullName, email: user.email, phone: user.phone, program: user.program });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ------------------ 8️⃣ FILE UPLOAD ROUTES (FIXED MANUAL UPLOAD) ------------------

// A. Upload Route (Manually Piping to GridFS)
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filename = `${Date.now()}-${req.file.originalname}`;

  // 1. Create a Readable Stream from the file buffer (Memory)
  const readableStream = new Readable();
  readableStream.push(req.file.buffer);
  readableStream.push(null); // End of stream

  // 2. Open a generic Upload Stream to GridFS
  const uploadStream = gridfsBucket.openUploadStream(filename, {
    contentType: req.file.mimetype
  });

  // 3. Pipe the file buffer -> GridFS
  readableStream.pipe(uploadStream);

  // 4. Handle Events
  uploadStream.on("error", (err) => {
    console.error("Upload Error:", err);
    return res.status(500).json({ message: "Error uploading file" });
  });

  uploadStream.on("finish", () => {
    // Return metadata exactly how frontend expects it
    res.json({ 
      filename: filename,
      fileId: uploadStream.id,
      contentType: req.file.mimetype,
      originalName: req.file.originalname 
    });
  });
});

// B. Retrieval Route
app.get("/api/file/:filename", async (req, res) => {
  try {
    const file = await gfs.files.findOne({ filename: req.params.filename });
    if (!file) {
      return res.status(404).json({ err: "No file found" });
    }
    
    // Set headers for proper display
    res.set("Content-Type", file.contentType);
    
    // Stream output
    const readstream = gridfsBucket.openDownloadStreamByName(file.filename);
    readstream.pipe(res);
  } catch (err) {
    console.error("File Read Error:", err);
    res.status(500).json({ err: "Server Error" });
  }
});

// ------------------ 9️⃣ Mount Routes ------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/api/admin-staff", adminStaffRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => res.send("✅ Backend Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));