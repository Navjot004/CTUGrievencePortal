import User from "../models/UserModel.js";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

// ================= EMAIL SETUP =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Google App Password
  },
});

// =================================================
// 1️⃣ REGISTER REQUEST (SEND OTP)
// =================================================
export const registerRequest = async (req, res) => {
  try {
    const { email, password, id } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { id }] });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      ...req.body,
      password: hashedPassword,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 min
      isVerified: false,
    };

    await User.findOneAndUpdate(
      { email },
      userData,
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "CT University - OTP Verification",
      text: `Your OTP is ${otp}. Valid for 10 minutes.`,
    });

    res.status(200).json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// =================================================
// 2️⃣ VERIFY OTP
// =================================================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Account verified successfully" });

  } catch (err) {
    console.error("OTP Verify Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// =================================================
// 3️⃣ LOGIN USER (🔥 MAIN FIX)
// =================================================
export const loginUser = async (req, res) => {
  try {
    const { id, password } = req.body;

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify OTP first" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        isDeptAdmin: user.isDeptAdmin,
        adminDepartment: user.adminDepartment,
      },
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: err.message });
  }
};
