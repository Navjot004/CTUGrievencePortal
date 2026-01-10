// server.js — Final Optimized: MongoDB + Twilio + GridFS + Excel Validation + Dynamic Roles
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
import { Readable } from "stream";
import xlsx from "xlsx";

// ✅ IMPORTS FOR FILE UPLOAD
import Grid from "gridfs-stream";
import multer from "multer";

// Modular DB and routes
import connectDB from "./config/db.js";
import grievanceRoutes from "./routes/grievanceRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js"; 
import UniversityRecord from "./models/UniversityRecord.js"; // Validation Model
import Grievance from "./models/GrievanceModel.js"; // ✅ Import Grievance Model
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

// ------------------ 2️⃣ Database & GridFS Init ------------------
connectDB();

const conn = mongoose.connection;
let gfs, gridfsBucket;

conn.once("open", async () => {
  // Init Stream
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads"
  });
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
  console.log("✅ GridFS Initialized (Native Streaming Mode)");

  // ⚠️ AUTO-FIX: Drop 'email_1' index to allow testing with same email
  try {
    const collection = conn.db.collection("users");
    const indexes = await collection.indexes();
    const emailIndex = indexes.find(idx => idx.name === "email_1");

    if (emailIndex) {
      await collection.dropIndex("email_1");
      console.log("🔥 FIX APPLIED: Dropped unique email index (Testing Mode ON)");
    }
  } catch (err) {
    console.log("ℹ️ Index check skipped:", err.message);
  }
});

// ✅ STORAGE ENGINE (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ------------------ 3️⃣ Email & Twilio Config ------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const twilioClient = process.env.TWILIO_SID && process.env.TWILIO_TOKEN
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
    : null;

// ------------------ 4️⃣ User & OTP Models (Inline Definition) ------------------
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  role: { type: String, enum: ["student", "staff", "admin"], required: true },
  fullName: String,
  email: { type: String, required: true },
  phone: String,
  password: { type: String, required: true },
  program: String,
  studentType: String,
  staffDepartment: { type: String, default: "" },
 
  // ✅ DYNAMIC ADMIN FIELDS
  isDeptAdmin: { type: Boolean, default: false },
  adminDepartment: { type: String, default: "" }
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

// ------------------ 5️⃣ ADMIN FEATURES (🔥 FIXED ROUTES & LOGIC) ------------------

// A. Upload Excel Records
app.post("/api/admin/upload-records", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let count = 0;
    for (const row of data) {
      if (row.ID && row.Email) {
        const safeId = row.ID.toString().trim().toUpperCase();

        await UniversityRecord.findOneAndUpdate(
          { id: safeId },
          {
            id: safeId,
            fullName: row.Name,
            email: row.Email.toLowerCase(),
            role: row.Role ? row.Role.toLowerCase() : "student",
            department: row.Department || "",
            program: row.Program || ""
          },
          { upsert: true, new: true }
        );
        count++;
      }
    }

    res.json({ message: `✅ Successfully processed ${count} records.` });
  } catch (err) {
    console.error("Excel Upload Error:", err);
    res.status(500).json({ message: "Error processing Excel file" });
  }
});

// ✅ B. Promote/Demote Staff (HIERARCHY FIXED)
// New Route Name: /api/admin-staff/role (Matches Frontend)
app.post("/api/admin-staff/role", async (req, res) => {
  try {
    const { requesterId, targetStaffId, action, department } = req.body;
    
    // 1. Requester Validation
    const requester = await User.findOne({ id: requesterId.toString().trim().toUpperCase() });
    
    // Master Admin (10001) bypass check
    if (requesterId !== "10001") {
       if (!requester || !requester.isDeptAdmin) {
         return res.status(403).json({ message: "❌ Access Denied" });
       }
    }

    const isMaster = requesterId === "10001";
    const isDeptAdmin = requester ? requester.isDeptAdmin : false;

    // Dept Admin Restriction: Can only add to own department
    if (!isMaster && isDeptAdmin) {
      if (action === "promote" && department !== requester.adminDepartment) {
        return res.status(403).json({ message: `❌ You can only manage staff for ${requester.adminDepartment}.` });
      }
    }

    // 2. Find Target Staff
    const safeTargetId = targetStaffId.toString().trim().toUpperCase();
    const targetMember = await User.findOne({ id: safeTargetId });

    if (!targetMember) return res.status(404).json({ message: "Target staff member not found." });

    // Dept Admin Restriction: Cannot remove other Dept Admins
    if (!isMaster && isDeptAdmin && action === "demote") {
      if (targetMember.adminDepartment !== requester.adminDepartment) {
        return res.status(403).json({ message: "❌ You cannot manage staff of other departments." });
      }
    }

    // 3. Perform Action
    if (action === "promote") {
      // 🔥 NEW: Check if another admin already exists for this department
      if (isMaster) {
        // Master promoting someone to Admin -> Check if dept already has an admin
        const existingAdmin = await User.findOne({
          role: "staff",
          adminDepartment: department,
          isDeptAdmin: true,
          id: { $ne: safeTargetId } // Exclude current target
        });

        if (existingAdmin) {
          // Remove the old admin
          existingAdmin.isDeptAdmin = false;
          existingAdmin.adminDepartment = "";
          await existingAdmin.save();
          console.log(`🔄 Removed ${existingAdmin.fullName} from Admin role for ${department}`);
        }
      }

      targetMember.adminDepartment = department;
      
      // 🔥 CRITICAL HIERARCHY FIX 🔥
      // Agar Master Admin kar raha hai -> Boss (Admin) banao
      // Agar Dept Admin kar raha hai -> Team Member (Staff) banao
      if (isMaster) {
        targetMember.isDeptAdmin = true;
        targetMember.role = "admin"; // 🔥 Change role to admin
      } else {
        targetMember.isDeptAdmin = false;
        targetMember.role = "staff"; // Keep as staff (team member)
      }

      await targetMember.save();

      // ✅ SEND PROMOTION EMAIL
      const promotionDate = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
      });

      const newRole = targetMember.isDeptAdmin ? "Department Admin" : "Admin Staff";
      const emailBody = `
        <h2 style="color: #2563eb;">Congratulations!</h2>
        <p>Dear ${targetMember.fullName},</p>
        <p>You have been promoted to <strong>${newRole}</strong> for <strong>${department}</strong>.</p>
        <p><strong>Date & Time:</strong> ${promotionDate}</p>
        <p><strong>Staff ID:</strong> ${targetMember.id}</p>
        <p style="background: #fef3c7; padding: 10px; border-radius: 5px; border-left: 4px solid #f59e0b; color: #92400e;">
          <strong>⚠️ Important:</strong> Please logout and login again to see your new dashboard.
        </p>
      `;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: targetMember.email,
          subject: `🎉 Promotion Notification - ${newRole}`,
          html: emailBody
        });
        console.log(`✅ Promotion email sent to ${targetMember.email}`);
      } catch (emailErr) {
        console.error("⚠️ Email sending failed:", emailErr);
      }

      const title = targetMember.isDeptAdmin ? "Admin" : "Team Member";
      res.json({ message: `✅ ${targetMember.fullName} is now ${title} of ${department}` });

    } else if (action === "demote") {
      targetMember.isDeptAdmin = false;
      targetMember.adminDepartment = "";
      targetMember.role = "staff"; // 🔥 Change role back to staff
      await targetMember.save();

      // 🔥 RESET ASSIGNED GRIEVANCES TO PENDING
      const updateResult = await Grievance.updateMany(
        { assignedTo: safeTargetId },
        { 
          $set: { status: "Pending", assignedTo: null, assignedRole: null, assignedBy: null } 
        }
      );

      console.log(`🔄 Reset ${updateResult.modifiedCount} grievances for demoted staff ${safeTargetId}`);

      res.json({ message: `✅ ${targetMember.fullName} removed from department role. ${updateResult.modifiedCount} grievances reset to Pending.` });
    } else {
      res.status(400).json({ message: "Invalid action" });
    }

  } catch (err) {
    console.error("Role Management Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ C. Get All Staff List (ROUTE NAME FIXED)
// New Route Name: /api/admin-staff/all (Matches Frontend)
app.get("/api/admin-staff/all", async (req, res) => {
  try {
    // Fetch: 
    // 1. All staff (role = "staff")
    // 2. All admins (role = "admin")
    // 3. Exclude Master Admin (id = 10001)
    const staffList = await User.find({
      id: { $ne: "10001" }, // Exclude master admin
      role: { $in: ["staff", "admin"] } // Include both staff and admin roles
    }).select("id fullName email isDeptAdmin adminDepartment role");
    
    res.json(staffList);
  } catch (err) {
    console.error("Staff fetch error:", err);
    res.status(500).json({ message: "Error fetching staff list" });
  }
});

// D. Get Department Specific Staff
app.get("/api/admin/staff/:department", async (req, res) => {
  try {
    const { department } = req.params;
    // Fetch ANYONE in that department (Boss or Team Member)
    const staff = await User.find({
      role: "staff",
      adminDepartment: department
    }).select("id fullName");

    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Error fetching department staff" });
  }
});

// ------------------ 6️⃣ REGISTRATION ROUTES ------------------

app.post("/api/auth/register-request", async (req, res) => {
  try {
    const { id, email, role } = req.body;
    const upperId = id.toString().trim().toUpperCase();
    const validRecord = await UniversityRecord.findOne({ id: upperId });
    
    if (!validRecord) return res.status(403).json({ message: "ID not found in Records." });
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // ✅ YE LINE ADD KI HAI (Ab Terminal me OTP dikhega)
    console.log(`\n🔥 [REGISTER OTP] Sent to ${email}: ${otp}\n`); 

    await OTP.findOneAndUpdate({ email: email.toLowerCase() }, { userId: upperId, otp, expiresAt: Date.now() + 600000 }, { upsert: true });
    
    // Email Send
    await transporter.sendMail({ 
        from: process.env.EMAIL_USER, 
        to: email, 
        subject: "Registration OTP", 
        html: `<p>Your OTP is: <b>${otp}</b></p>` 
    });

    res.status(200).json({ message: "OTP sent" });
  } catch (err) { 
      console.error(err);
      res.status(500).json({ message: "Error" }); 
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp, formData } = req.body;
    const otpRecord = await OTP.findOne({ email: email.toLowerCase(), otp });
    if (!otpRecord || Date.now() > otpRecord.expiresAt) return res.status(400).json({ message: "Invalid/Expired OTP" });
    const hashedPassword = await bcrypt.hash(formData.password, 10);

    const newUser = await User.create({
      id: formData.id.toString().trim().toUpperCase(),
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
    if (err.code === 11000) return res.status(400).json({ message: "ID or Email already exists." });
    res.status(500).json({ message: "Registration failed" });
  }
});

// ------------------ 7️⃣ LOGIN ROUTES ------------------

// ✅ DEBUG VERSION: LOGIN ROUTE
// ✅ LOGIN ROUTE (With OTP Log + Email)
app.post("/api/auth/request-otp", async (req, res) => {
  try {
    const { role, id, phone, password } = req.body;
    const safeId = id.toString().trim().toUpperCase();
    console.log(`\n🔍 [LOGIN ATTEMPT] ID: ${safeId}`);

    const user = await User.findOne({ role: role.toLowerCase(), id: safeId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.phone.toString().trim() !== phone.toString().trim()) {
      return res.status(400).json({ message: "Phone mismatch" });
    }

    const isMatch = await bcrypt.compare(password.toString().trim(), user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // ✅ YE LINE ADD KI HAI (Ab Terminal me OTP dikhega)
    console.log(`\n🔥 [LOGIN OTP] Sent to ${user.email}: ${otp}\n`);

    await OTP.create({ userId: safeId, phone, otp, expiresAt: Date.now() + 300000 });
    
    // ✅ EMAIL SENDING LOGIC (Ye bhi add kar diya)
    await transporter.sendMail({ 
        from: process.env.EMAIL_USER, 
        to: user.email, 
        subject: "Login OTP", 
        html: `<p>Your Login OTP is: <b>${otp}</b></p>` 
    });

    res.json({ message: "OTP sent" });
  } catch (err) { 
      console.error(err); 
      res.status(500).json({ message: "Error" }); 
  }
});
app.post("/api/auth/verify-otp-password", async (req, res) => {
  try {
    const { id, otp, password, role } = req.body;
    const safeId = id.toString().trim().toUpperCase();

    const user = await User.findOne({ id: safeId, role: role.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otpRecord = await OTP.findOne({ userId: safeId, otp });
    if (!otpRecord || Date.now() > otpRecord.expiresAt) return res.status(400).json({ message: "Invalid OTP" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });
    await OTP.deleteOne({ _id: otpRecord._id });

    // ✅ Include admin details in token response
    const token = jwt.sign({
      id: user.id,
      role: user.role,
      isDeptAdmin: user.isDeptAdmin,
      adminDepartment: user.adminDepartment
    }, "mock_secret");

    res.json({
      message: "✅ Login success",
      id: user.id,
      role: user.role,
      token,
      isDeptAdmin: user.isDeptAdmin,
      adminDepartment: user.adminDepartment
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

// server.js -> /api/auth/user/:id Route
app.get("/api/auth/user/:id", async (req, res) => {
  try {
    const safeId = req.params.id.toString().trim().toUpperCase();
    const user = await User.findOne({ id: safeId });
    
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔥 LOGIC FIX:
    // Agar Student hai -> toh 'program' bhejo
    // Agar Staff hai -> toh 'staffDepartment' ya 'adminDepartment' bhejo
    let deptToSend = "";
    
    if (user.role === "student") {
        deptToSend = user.program; 
    } else {
        deptToSend = user.staffDepartment || user.adminDepartment;
    }

    res.json({ 
        fullName: user.fullName, 
        email: user.email, 
        phone: user.phone, 
        role: user.role,
        // Frontend ko ab hamesha 'department' milega
        department: deptToSend || "General" 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
// ------------------ 8️⃣ FILE UPLOAD (Manual Stream) ------------------

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    console.error("❌ [UPLOAD] No file found in request body");
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filename = `${Date.now()}-${req.file.originalname}`;

  const readableStream = new Readable();
  readableStream.push(req.file.buffer);
  readableStream.push(null);

  const uploadStream = gridfsBucket.openUploadStream(filename, { contentType: req.file.mimetype });
  readableStream.pipe(uploadStream);

  uploadStream.on("error", (err) => {
    console.error("❌ [UPLOAD] Stream Error:", err);
    res.status(500).json({ message: "Error uploading file" });
  });

  uploadStream.on("finish", () => {
    res.json({
      filename: filename,
      fileId: uploadStream.id,
      contentType: req.file.mimetype,
      originalName: req.file.originalname
    });
  });
});

app.get("/api/file/:filename", async (req, res) => {
  try {
    // 🔥 FIX: Use gridfsBucket (Native) instead of gfs (gridfs-stream) for reliability
    const files = await gridfsBucket.find({ filename: req.params.filename }).toArray();
    if (!files || files.length === 0) return res.status(404).json({ err: "No file found" });
    
    const file = files[0];
    res.set("Content-Type", file.contentType);
    const readstream = gridfsBucket.openDownloadStreamByName(file.filename);
    readstream.pipe(res);
  } catch (err) {
    console.error("File download error:", err);
    res.status(500).json({ err: "Server Error" });
  }
});

// ------------------ 9️⃣ Mount Routes ------------------

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes); 
app.use("/api/grievances", grievanceRoutes);
app.use("/api/chat", chatRoutes);
app.get("/", (req, res) => res.send("✅ Backend Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));