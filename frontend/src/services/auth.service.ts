import api from "../lib/axios";

// ----------------- Interfaces -----------------

// Dữ liệu đăng ký
export interface RegisterData {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Dữ liệu xác thực OTP
export interface VerifyOtpData {
  email: string;
  otp_code: string;
}

// Dữ liệu quên mật khẩu
export interface ForgotPasswordData {
  email: string;
}

// Dữ liệu đăng nhập
export interface LoginData {
  email: string;
  password: string;
}

// Dữ liệu user trả về từ backend
export interface UserData {
  _id: string;
  email: string;
  role: string;
  status: string;
    fullName?: string;
  username?: string;
  name?: string;
}

// Kiểu response chuẩn từ backend
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token?: string;
    user?: UserData;
    requiresVerification?: boolean;
  };
}

// ----------------- API Functions -----------------

// Đăng ký tài khoản
export const register = (data: RegisterData) => {
  return api.post<AuthResponse>("/auth/register", data);
};

// Xác thực OTP (kích hoạt tài khoản)
export const verifyOtp = (data: VerifyOtpData) => {
  return api.post<AuthResponse>("/auth/verify-otp", data);
};

// Quên mật khẩu → gửi email đặt lại mật khẩu
export const forgotPassword = (data: ForgotPasswordData) => {
  return api.post<AuthResponse>("/auth/forgot-password", data);
};

// Đăng nhập bằng email/password
export const login = (data: LoginData) => {
  return api.post<AuthResponse>("/auth/login", data);
};

// Đăng nhập bằng Google
export const loginGoogle = (tokenId: string) => {
  return api.post<AuthResponse>("/auth/google", { tokenId });
};
