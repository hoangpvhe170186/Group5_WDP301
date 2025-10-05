import api from "../lib/axios";

// Định nghĩa các kiểu dữ liệu cho các tham số
interface RegisterData {
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface OtpData {
  phone: string;
  otp: string;
}



// Đăng ký bằng email/password
export const register = (data: RegisterData) => {
  return api.post("/auth/register", data);
};

// Xác thực OTP
export const verifyOtp = (data: OtpData) => {
  return api.post("/auth/verify-otp", data);
};

// Đăng ký bằng Google
export const registerGoogle = (tokenId: string) => {
  return api.post("/auth/register/google", { tokenId });
};

// Quên mật khẩu (gửi mật khẩu tạm qua email)
export const forgotPassword = (email: string) => {
  return api.post("/auth/forgot-password", { email });
};

// Đăng nhập bằng email/password
export const login = (data: LoginData) => {
  return api.post("/auth/login", data);
};

// Đăng nhập bằng Google
export const loginGoogle = (tokenId: string) => {
  return api.post("/auth/login/google", { tokenId });
};
