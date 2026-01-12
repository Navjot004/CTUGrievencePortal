import express from "express";
import { registerRequest, verifyRegistration, loginUser, verifyLogin } from "../controllers/authController.js";

const router = express.Router();

// Register (Step 1 & 2)
router.post("/register-request", registerRequest);
router.post("/verify-registration", verifyRegistration); // 📝 Renamed from verify-otp

// Login (Step 1 & 2)
router.post("/login", loginUser);
router.post("/verify-login", verifyLogin); // 🔐 New Route

export default router;
