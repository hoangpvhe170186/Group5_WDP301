import { Router } from "express";
import {
  register,
  verifyOtp,
  registerGoogle,
  forgotPassword,
  login,
  loginGoogle,
  resendOtp,
} from "../controller/authController";

const router = Router();

// Các route xác thực
router.post("/auth/register", register);
router.post("/auth/verify-otp", verifyOtp);
router.post("/auth/register/google", registerGoogle);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/resend-otp", resendOtp);
router.post("/auth/login", login);
router.post("/auth/login/google", loginGoogle);

export default router;
