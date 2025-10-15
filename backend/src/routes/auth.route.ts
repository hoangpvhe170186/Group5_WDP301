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

// Các route xác thực
router.post("/auth/register", register);
router.post("/auth/verify-otp", verifyOtp);

router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/resend-otp", resendOtp);
router.post("/auth/login", login);
router.post("/auth/google", loginGoogle);

export default router;
