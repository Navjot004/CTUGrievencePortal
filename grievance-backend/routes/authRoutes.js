import express from "express";
import {
  registerRequest,
  verifyOtp,
  loginUser
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register-request", registerRequest);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);

export default router;
