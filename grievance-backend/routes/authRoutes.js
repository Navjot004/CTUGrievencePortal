import express from "express";
import { registerRequest, verifyRegistration, loginUser, verifyLogin } from "../controllers/authController.js";
import bcrypt from "bcryptjs";



const router = express.Router();

// Register (Step 1 & 2)
router.post("/register-request", registerRequest);
router.post("/verify-registration", verifyRegistration); // 📝 Renamed from verify-otp
import User from "../models/UserModel.js";

// Login (Step 1 & 2)
router.post("/login", loginUser);
router.post("/verify-login", verifyLogin); // 🔐 New Route
router.post("/forgot-password", async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Phone number not registered" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.resetOtp = hashedOtp;
    user.resetOtpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // 🔥 FOR NOW (testing)
    console.log("📱 Password Reset OTP:", otp);

    res.json({ message: "OTP sent to registered phone number" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    const user = await User.findOne({
      phone,
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    const isOtpValid = await bcrypt.compare(otp, user.resetOtp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;

    await user.save();

    res.json({ message: "✅ Password reset successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Password reset failed" });
  }
});

export default router;
