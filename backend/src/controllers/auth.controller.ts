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

// ==================================================
// 🔹 Helper: Tạo JWT
// ==================================================
const generateToken = (userId: string, role: Role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });

// ==================================================
// 🔹 Helper: Trả response chuẩn
// ==================================================
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
  try {
    const { full_name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword)
      return sendResponse(res, false, "Mật khẩu xác nhận không khớp", null, 400);

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return sendResponse(res, false, "Email đã tồn tại", null, 400);

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      full_name,
      email,
      password_hash: hashedPassword,
      phone: null,
      role: Role.Customer,
      status: Status.Inactive,
    });

    // Gửi OTP xác thực
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 60 * 1000);
    await Otp.findOneAndUpdate(
      { user_id: newUser._id },
      { otp_code: otpCode, attempts: 0, expires_at: expiresAt },
      { upsert: true }
    );

    await sendOtpEmail(email, otpCode);

    return sendResponse(
      res,
      true,
      "Đăng ký thành công! Mã OTP đã được gửi đến email của bạn."
    );
  } catch (error: any) {
    console.error("Register Error:", error);
    sendResponse(res, false, "Lỗi máy chủ: " + error.message, null, 500);
  }
};

// ==================================================
// 🔹 Xác thực OTP
// ==================================================
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp_code } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, false, "Không tìm thấy người dùng", null, 404);

    const otp = await Otp.findOne({ user_id: user._id });
    if (!otp) return sendResponse(res, false, "OTP không tồn tại", null, 400);

    if (otp.expires_at < new Date())
      return sendResponse(res, false, "OTP đã hết hạn", null, 400);

    if (otp.attempts >= 5)
      return sendResponse(res, false, "Nhập sai OTP quá 5 lần", null, 400);

    if (otp.otp_code !== otp_code) {
      otp.attempts += 1;
      await otp.save();
      return sendResponse(res, false, "OTP không chính xác", null, 400);
    }

    // Kích hoạt tài khoản
    user.status = Status.Active;
    await Promise.all([user.save(), Otp.deleteOne({ _id: otp._id })]);

    const token = generateToken( user._id.toString(),user.role);
    sendResponse(res, true, "Xác thực thành công", {
      token,
      user: {
        _id: user._id,
        email: user.email,
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
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, false, "Không tìm thấy người dùng", null, 404);

    if (user.status === Status.Active)
      return sendResponse(res, false, "Tài khoản đã được kích hoạt", null, 400);

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await Otp.findOneAndUpdate(
      { user_id: user._id },
      { otp_code: otpCode, attempts: 0, expires_at: expiresAt },
      { upsert: true }
    );

    await sendOtpEmail(email, otpCode);
    sendResponse(res, true, "OTP mới đã được gửi đến email của bạn");
  } catch (error: any) {
    sendResponse(res, false, "Lỗi máy chủ: " + error.message, null, 500);
  }
};

// ==================================================
// 🔹 Đăng nhập thường
// ==================================================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, false, "Email không tồn tại", null, 404);

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return sendResponse(res, false, "Sai mật khẩu", null, 400);

    const token = generateToken(user._id.toString(), user.role);

    // Nếu user chưa active → tự động gửi OTP
    if (user.status !== Status.Active) {
      const otpCode = generateOtp();
      const expiresAt = new Date(Date.now() + 60 * 1000);

      await Otp.findOneAndUpdate(
        { user_id: user._id },
        { otp_code: otpCode, attempts: 0, expires_at: expiresAt },
        { upsert: true }
      );

      await sendOtpEmail(email, otpCode);

      return sendResponse(res, true, "Tài khoản chưa được kích hoạt. OTP mới đã được gửi đến email.", {
        token,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        requiresVerification: true,
      });
    }

    // Nếu active → đăng nhập thành công
    sendResponse(res, true, "Đăng nhập thành công", {
      token,
      user: {
        _id: user._id,
        full_name : user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
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
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, false, "Không tìm thấy người dùng", null, 404);

    if (user.status !== Status.Active)
      return sendResponse(res, false, "Tài khoản chưa được kích hoạt", null, 400);

    const tempPassword = generateTempPassword();
    user.password_hash = await bcrypt.hash(tempPassword, 10);
    await user.save();

    await sendResetPasswordEmail(email, tempPassword);
    sendResponse(res, true, "Mật khẩu tạm thời đã được gửi đến email của bạn");
  } catch (error: any) {
    sendResponse(res, false, "Lỗi máy chủ: " + error.message, null, 500);
  }
};


// ==================================================
// 🔹 Đăng nhập (hoặc tự động đăng ký) bằng Google
// ==================================================
export const loginGoogle = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.body;

    // ✅ Xác thực token Google
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.VITE_GOOGLE_CLIENT_ID as string,
    });

    const payload = ticket.getPayload();
    if (!payload)
      return sendResponse(res, false, "Không xác thực được Google token", null, 400);

    const { email, name, picture } = payload;

    if (!email)
      return sendResponse(res, false, "Google không trả về email hợp lệ", null, 400);

    // 🔍 Tìm user trong database
    let user = await User.findOne({ email });

    // 🟢 Nếu user chưa tồn tại → tự động tạo tài khoản mới
    if (!user) {
      user = await User.create({
        full_name: name || "Người dùng Google",
        email,
        password_hash: "", // Không cần mật khẩu
        avatar: picture || null,
        role: Role.Customer,
        status: Status.Active, // Google OAuth coi như đã xác thực danh tính
      });
    }

    // 🚫 Nếu tài khoản bị khóa (tùy chính sách hệ thống)
    if (user.status === Status.Inactive) {
      return sendResponse(res, false, "Tài khoản Google chưa được kích hoạt", null, 403);
    }

    // ✅ Tạo token JWT
    const token = generateToken(user._id.toString(), user.role);

    // ✅ Trả về thông tin user + token
    sendResponse(res, true, "Đăng nhập Google thành công", {
      token,
      user: {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error("Google Login Error:", error);
    sendResponse(res, false, "Lỗi máy chủ: " + error.message, null, 500);
  }
};

