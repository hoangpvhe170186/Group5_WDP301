"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiCheckLine, RiArrowLeftLine } from "react-icons/ri";
import { forgotPassword, type ForgotPasswordData} from "../../services/auth.service";

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
      aria-required={required ? "true" : "false"}
    />
  </div>
);

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const forgotPasswordData: ForgotPasswordData = { email };

    try {
      const response = await forgotPassword(forgotPasswordData);
      if (response.data.message) {
        setIsLoading(false);
        setIsSubmitted(true); // Chuyển sang trạng thái thành công
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Đã xảy ra lỗi khi gửi yêu cầu, vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-50 to-orange-100 items-center justify-center p-12">
          <div className="relative w-full max-w-md">
            <img
              src="/orange-delivery-vehicles-illustration-isometric.jpg"
              alt="Delivery vehicles illustration"
              width={500}
              height={500}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Right side - Success Message */}
        <div className="flex-1 flex items-center justify-center p-6 bg-white">
          <div className="w-full max-w-md space-y-8 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-orange-500" fill="currentColor" aria-hidden="true">
                  <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
                </svg>
                <span className="text-3xl font-bold text-orange-500">Home Express</span>
              </div>
            </div>

            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <RiCheckLine className="w-10 h-10 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-gray-900">Kiểm tra email của bạn</h1>
              <p className="text-gray-600">
                Chúng tôi đã gửi mã xác thực đến email <span className="font-semibold text-gray-900">{email}</span>
              </p>
              <p className="text-sm text-gray-500">
                Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn để đặt lại mật khẩu của bạn.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
                className="w-full h-12 rounded-md text-white font-semibold text-base bg-orange-500 hover:bg-orange-600 transition"
                aria-label="Gửi lại email"
              >
                Gửi lại email
              </button>
              <div className="text-center">
                <button
                  onClick={() => navigate("/auth/login")}
                  className="text-sm text-orange-500 font-semibold hover:underline flex items-center justify-center gap-1"
                  aria-label="Quay lại đăng nhập"
                >
                  <RiArrowLeftLine className="w-4 h-4" />
                  Quay lại đăng nhập
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-50 to-orange-100 items-center justify-center p-12">
        <div className="relative w-full max-w-md">
          <img
            src="/orange-delivery-vehicles-illustration-isometric.jpg"
            alt="Delivery vehicles illustration"
            width={500}
            height={500}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-orange-500" fill="currentColor" aria-hidden="true">
                <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
              </svg>
              <span className="text-3xl font-bold text-orange-500">LALAMOVE</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu?</h1>
            <p className="text-gray-600">Nhập email của bạn và chúng tôi sẽ gửi mã xác thực để đặt lại mật khẩu</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <InputField
                id="email"
                label="Email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={setEmail}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-12 rounded-md text-white font-semibold text-base transition ${
                isLoading ? "bg-orange-300 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
              }`}
              aria-disabled={isLoading}
            >
              {isLoading ? "Đang gửi..." : "Gửi mã xác thực"}
            </button>
            <div className="text-center">
              <button
                onClick={() => navigate("/auth/login")}
                className="text-sm text-orange-500 font-semibold hover:underline flex items-center justify-center gap-1"
                aria-label="Quay lại đăng nhập"
              >
                <RiArrowLeftLine className="w-4 h-4" />
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}