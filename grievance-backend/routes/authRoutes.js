import express from "express";
const router = express.Router();
import { registerRequest, verifyOtp } from "../controllers/authController.js";

router.post("/register-request", registerRequest);
router.post("/verify-otp", verifyOtp);

export default router;