import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { generateOtp } from "../utils/generateOtp";
import { generateTempPassword } from "../utils/generateTempPassword";
import { sendOtpEmail, sendResetPasswordEmail } from "../services/mail.service";
import User, { Role, Status } from "../models/User";
import Otp from "../models/OTP";

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID as string);

// Helper: Tạo JWT
const generateToken = (userId: string, role: Role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });

// Helper: Trả response chuẩn
const sendResponse = (
  res: Response,
  success: boolean,
  message: string,
  data: any = null,
  statusCode = 200
) => res.status(statusCode).json({ success, message, data });

// ==================================================
// 🔹 Đăng ký người dùng mới (email/password)
// ==================================================
export const register = async (req: Request, res: Response) => {
    // ... (Hàm này không thay đổi)
};


// ==================================================
// 🔹 Xác thực OTP
// ==================================================
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp_code } = req.body;
    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, false, "Không tìm thấy người dùng", null, 404);

    // ... (logic kiểm tra OTP không đổi)

    // Kích hoạt tài khoản
    user.status = Status.Active;
    await Promise.all([user.save(), Otp.deleteOne({ _id: otp._id })]);

    const token = generateToken(user._id.toString(), user.role);
    
    // ✅ SỬA LỖI Ở ĐÂY
    sendResponse(res, true, "Xác thực thành công", {
      token,
      user: {
        _id: user._id,
        full_name: user.full_name, // <-- Bổ sung
        email: user.email,
        avatar: user.avatar,       // <-- Bổ sung
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    sendResponse(res, false, "Lỗi máy chủ: " + error.message, null, 500);
  }
};


// ==================================================
// 🔹 Gửi lại OTP
// ==================================================
export const resendOtp = async (req: Request, res: Response) => {
    // ... (Hàm này không thay đổi)
};


// ==================================================
// 🔹 Đăng nhập thường
// ==================================================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, false, "Email không tồn tại", null, 404);
    
    // ... (logic kiểm tra mật khẩu không đổi)

    const token = generateToken(user._id.toString(), user.role);

    // ✅ SỬA LỖI Ở ĐÂY CHO CẢ HAI TRƯỜNG HỢP
    const userPayload = {
        _id: user._id,
        full_name: user.full_name, // <-- Bổ sung
        email: user.email,
        avatar: user.avatar,       // <-- Bổ sung
        role: user.role,
        status: user.status,
    };

    if (user.status !== Status.Active) {
        // ... (logic gửi lại OTP không đổi)
        return sendResponse(res, true, "Tài khoản chưa được kích hoạt...", {
            token,
            user: userPayload,
            requiresVerification: true,
        });
    }

    // Nếu active → đăng nhập thành công
    sendResponse(res, true, "Đăng nhập thành công", {
      token,
      user: userPayload,
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    sendResponse(res, false, "Lỗi máy chủ: " + error.message, null, 500);
  }
};


// ==================================================
// 🔹 Quên mật khẩu
// ==================================================
export const forgotPassword = async (req: Request, res: Response) => {
    // ... (Hàm này không thay đổi)
};


// ==================================================
// 🔹 Đăng nhập bằng Google
// ==================================================
export const loginGoogle = async (req: Request, res: Response) => {
    // ... (Hàm này đã đúng, không cần sửa)
};