"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { register, loginGoogle, type RegisterData } from "../../services/auth.service";

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==============================
  // 🔹 Xử lý nhập liệu
  // ==============================
  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // ==============================
  // 🔹 Xử lý đăng ký bằng email/password
  // ==============================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("Vui lòng đồng ý với điều khoản và điều kiện");
      return;
    }

    setIsLoading(true);
    setError(null);

    const registerData: RegisterData = {
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    try {
      const response = await register(registerData);
      const { success, message } = response.data;

      if (!success) {
        setError(message || "Đăng ký thất bại, vui lòng thử lại.");
        return;
      }

      sessionStorage.setItem("auth_email", formData.email);
      navigate("/auth/verify-otp");
    } catch (err) {
      console.error("Register error:", err);
      setError("Đăng ký lỗi, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================
  // 🔹 Đăng nhập / đăng ký bằng Google
  // ==============================
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) {
        setError("Không nhận được thông tin từ Google.");
        return;
      }

      const response = await loginGoogle(credentialResponse.credential);
      const { success, data, message } = response.data;

      if (!success || !data) {
        setError(message || "Đăng nhập Google thất bại.");
        return;
      }

      const { token, user } = data;

      // ✅ Lưu token và role
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_role", user.role);

      // ✅ Điều hướng
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
      {/* Left side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-50 to-orange-100 items-center justify-center p-12">
        <img
          src="/orange-delivery-vehicles-illustration-isometric.jpg"
          alt="Delivery vehicles"
          width={400}
          height={400}
          className="w-full h-auto"
        />
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-orange-500" fill="currentColor">
                <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
              </svg>
              <span className="text-3xl font-bold text-orange-500">Home Express</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản miễn phí</h1>
          </div>

          {error && (
            <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <InputField
                id="full_name"
                label="Họ và tên"
                type="text"
                placeholder="Nhập họ và tên của bạn"
                value={formData.full_name}
                onChange={(value) => handleInputChange("full_name", value)}
                required
              />
              <InputField
                id="email"
                label="Email"
                type="email"
                placeholder="Nhập địa chỉ email"
                value={formData.email}
                onChange={(value) => handleInputChange("email", value)}
                required
              />
              <InputField
                id="phone"
                label="Số điện thoại"
                type="text"
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={(value) => handleInputChange("phone", value)}
              />
              <InputField
                id="password"
                label="Mật khẩu"
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                value={formData.password}
                onChange={(value) => handleInputChange("password", value)}
                required
                minLength={6}
                showToggle
                showPassword={showPassword}
                toggleShowPassword={() => setShowPassword(!showPassword)}
              />
              <InputField
                id="confirmPassword"
                label="Xác nhận mật khẩu"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={(value) => handleInputChange("confirmPassword", value)}
                required
                minLength={6}
                showToggle
                showPassword={showConfirmPassword}
                toggleShowPassword={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                  className="mt-1 h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                  Tôi đồng ý với{" "}
                  <a href="#" className="text-orange-500 hover:underline">
                    Điều khoản & Điều kiện
                  </a>{" "}
                  và{" "}
                  <a href="#" className="text-orange-500 hover:underline">
                    Chính sách Quyền Riêng Tư
                  </a>.
                </label>
              </div>
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
              {isLoading ? "Đang tạo tài khoản..." : "Đăng ký miễn phí"}
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
            <span>Đã có tài khoản? </span>
            <a href="/auth/login" className="text-orange-500 font-semibold hover:underline">
              Đăng nhập ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================
// 🔹 InputField component
// ==============================
const InputField: React.FC<{
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  showToggle?: boolean;
  showPassword?: boolean;
  toggleShowPassword?: () => void;
}> = ({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
  minLength,
  showToggle,
  showPassword,
  toggleShowPassword,
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-medium text-gray-700 block">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="h-12 w-full px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
      />
      {showToggle && (
        <button
          type="button"
          onClick={toggleShowPassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? <RiEyeOffLine className="w-5 h-5" /> : <RiEyeLine className="w-5 h-5" />}
        </button>
      )}
    </div>
  </div>
);
