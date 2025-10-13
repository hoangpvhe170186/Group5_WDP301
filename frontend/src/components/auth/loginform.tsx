"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { login, loginGoogle, type LoginData } from "../../services/auth.service";

const InputField: React.FC<{
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}> = ({ id, label, type, placeholder, value, onChange, required }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-medium text-gray-700 block">
      {label}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="h-12 w-full px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
    />
  </div>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===================================================
  // 🔹 Xử lý đăng nhập thông thường (email + password)
  // ===================================================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const loginData: LoginData = { email, password };

    try {
      const response = await login(loginData);
      const { success, data, message } = response.data;

      if (!success || !data) {
        setError(message || "Đăng nhập không thành công, vui lòng thử lại.");
        return;
      }

      const { token, user, requiresVerification } = data;
      if (!token || !user) {
        setError("Phản hồi từ máy chủ không hợp lệ.");
        return;
      }

      localStorage.setItem("auth_token", token);
      sessionStorage.setItem("auth_email", user.email);
      localStorage.setItem("user_role", user.role);
      localStorage.setItem("user_id", user._id);

      if (requiresVerification || user.status !== "Active") {
        navigate("/auth/verify-otp");
        return;
      }

      switch (user.role.toLowerCase()) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "driver":
          navigate("/driver/home");
          break;
        case "carrier":
          navigate("/carrier/home");
          break;
        case "customer":
          navigate("/user/home");
          break;
        default:
          navigate("/");
          break;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Đăng nhập thất bại, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // ===================================================
  // 🔹 Xử lý đăng nhập bằng Google OAuth
  // ===================================================
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) {
        setError("Không nhận được thông tin từ Google.");
        return;
      }
      console.log(credentialResponse.credential);

      const response = await loginGoogle(credentialResponse.credential);
      console.log("Google login response:", response.data);
      const { success, data, message } = response.data;
      

      if (!success || !data) {
        setError(message || "Đăng nhập Google thất bại.");
        return;
      }

      const { token, user } = data;
      if (!token || !user) {
        setError("Phản hồi không hợp lệ từ máy chủ.");
        return;
      }

      // ✅ Lưu token và role vào localStorage
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_role", user.role);
      localStorage.setItem("user_id", user._id);

      // ✅ Điều hướng theo role
      switch (user.role.toLowerCase()) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "driver":
          navigate("/driver/home");
          break;
        case "carrier":
          navigate("/carrier/home");
          break;
        case "customer":
          navigate("/user/home");
          break;
        default:
          navigate("/");
          break;
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("Đăng nhập Google thất bại, vui lòng thử lại.");
    }
  };

  const handleGoogleError = () => {
    setError("Đăng nhập Google không thành công, vui lòng thử lại.");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-50 to-orange-100 items-center justify-center p-12">
        <div className="relative w-full max-w-md">
          <img
            src="/orange-delivery-vehicles-illustration-isometric.jpg"
            alt="Delivery vehicles"
            width={500}
            height={500}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="w-10 h-10 text-orange-500"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
              </svg>
              <span className="text-3xl font-bold text-orange-500">Home Express</span>
            </div>
          </div>

          {error && (
            <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              id="email"
              label="Email"
              type="email"
              placeholder="Nhập địa chỉ email của bạn"
              value={email}
              onChange={setEmail}
              required
            />
            <InputField
              id="password"
              label="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={setPassword}
              required
            />
            <div className="text-right">
              <a
                href="/auth/forgot-password"
                className="text-sm text-orange-500 font-semibold hover:underline"
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-12 rounded-md text-white font-semibold text-base transition ${
                isLoading
                  ? "bg-orange-300 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Hoặc</span>
            </div>
          </div>

          {/* Google Login */}
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
            <div className="flex justify-center">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
            </div>
          </GoogleOAuthProvider>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            <span>Bạn mới sử dụng Home Express? </span>
            <a href="/auth/register" className="text-orange-500 font-semibold hover:underline">
              Tạo tài khoản miễn phí ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
