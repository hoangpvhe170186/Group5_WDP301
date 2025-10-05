import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { generateOtp } from "../utils/generateOtp";
import { generateTempPassword } from "../utils/generateTempPassword";
import { sendOtpEmail, sendResetPasswordEmail } from "../services/mail.service";
import User from "../models/user.model";
import Otp from "../models/otp.model";
import { Role, Status } from "../models/user.model";

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID as string);

// ========================
// Đăng ký (tạo user + gửi OTP)
// ========================
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email đã tồn tại" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      full_name,
      email,
      password_hash: hashedPassword,
      phone: null,
      role: Role.Customer,
      status: Status.Inactive,
    });

    await newUser.save();

    // Tạo OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 phút

    await Otp.findOneAndUpdate(
      { user_id: newUser._id },
      { otp_code: otpCode, attempts: 0, expires_at: expiresAt },
      { upsert: true, new: true }
    );

    // Gửi email OTP
    await sendOtpEmail(email, otpCode);

    res.status(201).json({ message: "Đăng ký thành công, OTP đã được gửi" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ========================
// Xác thực OTP
// ========================
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp_code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "Không tìm thấy người dùng" });
      return;
    }

    const otp = await Otp.findOne({ user_id: user._id });
    if (!otp) {
      res.status(400).json({ message: "OTP không tồn tại" });
      return;
    }

    if (otp.expires_at < new Date()) {
      res.status(400).json({ message: "OTP đã hết hạn" });
      return;
    }

    if (otp.attempts >= 5) {
      res.status(400).json({ message: "Sai OTP quá 5 lần" });
      return;
    }

    if (otp.otp_code !== otp_code) {
      otp.attempts += 1;
      await otp.save();
      res.status(400).json({ message: "OTP sai" });
      return;
    }

    user.status = Status.Active;
    await user.save();

    await Otp.deleteOne({ _id: otp._id });

    res.json({ message: "Xác thực thành công, tài khoản đã được kích hoạt" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ========================
// Gửi lại OTP
// ========================
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "Không tìm thấy người dùng" });
      return;
    }

    if (user.status === Status.Active) {
      res.status(400).json({ message: "Tài khoản đã được kích hoạt" });
      return;
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { user_id: user._id },
      { otp_code: otpCode, attempts: 0, expires_at: expiresAt },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, otpCode);

    res.json({ message: "OTP mới đã được gửi" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ========================
// Đăng ký Google
// ========================
export const registerGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenId } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.VITE_GOOGLE_CLIENT_ID as string,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: "Không xác thực được Google token" });
      return;
    }

    const { email, name, picture, sub } = payload;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email đã được đăng ký" });
      return;
    }

    const newUser = new User({
      full_name: name,
      email,
      password_hash: "",
      avatar: picture,
      role: Role.Customer,
      status: Status.Active,
    });

    await newUser.save();

    res.status(201).json({ message: "Đăng ký Google thành công" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ========================
// Quên mật khẩu
// ========================
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "Không tìm thấy người dùng" });
      return;
    }

    if (user.status !== Status.Active) {
      res.status(400).json({ message: "Tài khoản chưa được kích hoạt" });
      return;
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    user.password_hash = hashedPassword;
    await user.save();

    await sendResetPasswordEmail(email, tempPassword);

    res
      .status(200)
      .json({ message: "Mật khẩu tạm thời đã được gửi đến email của bạn" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ========================
// Đăng nhập thường
// ========================
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "Email không tồn tại" });
      return;
    }

    if (user.status !== Status.Active) {
      res.status(403).json({ message: "Tài khoản chưa được kích hoạt" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ message: "Sai mật khẩu" });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.json({ message: "Đăng nhập thành công", token });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ========================
// Đăng nhập Google
// ========================
export const loginGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenId } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.VITE_GOOGLE_CLIENT_ID as string,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: "Không xác thực được Google token" });
      return;
    }

    const { email } = payload;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "Tài khoản Google chưa được đăng ký" });
      return;
    }

    if (user.status !== Status.Active) {
      res.status(403).json({ message: "Tài khoản chưa được kích hoạt" });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.json({ message: "Đăng nhập Google thành công", token });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
