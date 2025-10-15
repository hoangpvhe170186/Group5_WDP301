"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RiArrowLeftLine } from "react-icons/ri";
import { verifyOtp, type VerifyOtpData } from "../../services/auth.service";

const OtpInput: React.FC<{
  index: number;
  value: string;
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  inputRef: (el: HTMLInputElement | null) => void;
}> = ({ index, value, onChange, onKeyDown, onPaste, inputRef }) => (
  <input
    ref={inputRef}
    type="text"
    inputMode="numeric"
    maxLength={1}
    value={value}
    onChange={(e) => onChange(index, e.target.value)}
    onKeyDown={(e) => onKeyDown(index, e)}
    onPaste={onPaste}
    className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
    aria-label={`Mã OTP số ${index + 1}`}
  />
);

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("auth_email");
    if (!storedEmail) {
      navigate("/auth/login");
      return;
    }
    setEmail(storedEmail);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);

    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const otpCode = otp.join("");

  if (otpCode.length !== 6) {
    setError("Vui lòng nhập đủ 6 chữ số OTP");
    return;
  }

  setIsLoading(true);
  setError(null);

  const verifyData: VerifyOtpData = { email, otp_code: otpCode };

  try {
    const response = await verifyOtp(verifyData);
    console.log("Verify OTP response:", response.data);
    localStorage.setItem("auth_token", response.data.token);
    navigate("/");
    // if (response.data.token) {
    //   // Lưu token vào localStorage
    //   localStorage.setItem("auth_token", response.data.token);
    //   // sessionStorage.removeItem("auth_email");
    //   console.log("OTP verified successfully.");
    //   navigate("/auth/login");
    // } else {
    //   setError(response.data.message || "Xác thực OTP không thành công.");
    // }
  } catch (err) {
    setError("Đã xảy ra lỗi khi xác thực OTP, vui lòng thử lại.");
  } finally {
    setIsLoading(false);
  }
};


  const handleResend = async () => {
    if (!canResend) return;

    setCanResend(false);
    setCountdown(60);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError("Không thể gửi lại mã OTP, vui lòng thử lại");
      setCanResend(true);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-50 to-orange-100 items-center justify-center p-12">
        <div className="relative w-full max-w-md">
          <img
            src="/orange-delivery-vehicles-illustration-isometric.jpg"
            alt="Delivery vehicles"
            width={400}
            height={400}
            className="w-full h-auto"
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8">
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
              <span className="text-3xl font-bold text-orange-500">
                Home Express
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Xác thực email</h1>
            <p className="text-gray-600">Chúng tôi đã gửi mã OTP đến email</p>
            <p className="text-orange-500 font-semibold">{email}</p>
          </div>

          {error && (
            <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <OtpInput
                    key={index}
                    index={index}
                    value={digit}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    inputRef={(el) => (inputRefs.current[index] = el)}
                  />
                ))}
              </div>
              <div className="text-center text-sm text-gray-600">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-orange-500 font-semibold hover:underline"
                    aria-label="Gửi lại mã OTP"
                  >
                    Gửi lại mã OTP
                  </button>
                ) : (
                  <span>
                    Gửi lại mã sau{" "}
                    <span className="font-semibold text-orange-500">
                      {countdown}s
                    </span>
                  </span>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || otp.join("").length !== 6}
              className={`w-full h-12 rounded-md text-white font-semibold text-base transition ${
                isLoading || otp.join("").length !== 6
                  ? "bg-orange-300 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
              aria-disabled={isLoading || otp.join("").length !== 6}
            >
              {isLoading ? "Đang xác thực..." : "Xác thực"}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => navigate("/auth/login")}
              className="text-sm text-gray-600 hover:text-orange-500 flex items-center justify-center gap-1"
              aria-label="Quay lại đăng nhập"
            >
              <RiArrowLeftLine className="w-4 h-4" />
              Quay lại đăng nhập
            </button>
          </div>

          <div className="flex justify-center gap-4 text-xs text-gray-500">
            <a href="#" className="hover:text-orange-500">
              Điều khoản và điều kiện
            </a>
            <span>•</span>
            <a href="#" className="hover:text-orange-500">
              Chính sách bảo mật
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
