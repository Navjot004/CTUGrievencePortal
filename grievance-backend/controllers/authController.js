import User from "../models/UserModel.js"; // Ensure path and extension are correct
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Google App Password
  },
});

// Step 1: OTP bhejna
export const registerRequest = async (req, res) => {
  try {
    const { email, password, id } = req.body;

    // Check if user already exists
    // Note: Aapke server.js ke schema ke hisaab se fields check karein
    const existingUser = await User.findOne({ $or: [{ email }, { id }] });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Data structure prepare karein
    const userData = {
      ...req.body,
      password: hashedPassword,
      otp,
      otpExpires: Date.now() + 600000, // 10 mins expiry
    };

    // Unverified user update ya create karein
    await User.findOneAndUpdate({ email }, userData, { upsert: true, new: true });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verification Code for CT University",
      text: `Your OTP for registration is: ${otp}. Valid for 10 minutes.`,
    });

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Register Request Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Step 2: OTP verify karke register karna
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
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: err.message });
  }
};