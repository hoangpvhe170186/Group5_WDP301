import { Router } from "express";
import {
  register,
  verifyOtp,
  forgotPassword,
  login,
  loginGoogle,
  resendOtp,
} from "../controllers/auth.controller";

const router = Router();

// ❌ Sai: router.post("/auth/login", login);
// ✅ Đúng:
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/google", loginGoogle);

export default router;
