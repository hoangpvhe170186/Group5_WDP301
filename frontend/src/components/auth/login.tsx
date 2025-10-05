// src/pages/LoginPage.tsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // TODO: Call API to send OTP to email
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Store email in sessionStorage for verification page
    sessionStorage.setItem("auth_email", email)

    // Navigate to OTP verification page
    navigate("/auth/verify-otp")
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-50 to-orange-100 items-center justify-center p-12">
        <div className="relative w-full max-w-md">
          <img
            src="/orange-delivery-vehicles-illustration-isometric.jpg"
            alt="Delivery vehicles"
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
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-orange-500" fill="currentColor">
                <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
              </svg>
              <span className="text-3xl font-bold text-orange-500">LALAMOVE</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập địa chỉ email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base"
            >
              {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
            </Button>
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

          {/* Social login buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#1877F2"
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
              <span className="text-gray-700 font-medium">Tiếp tục với tài khoản Facebook</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 font-medium">Tiếp tục với tài khoản Google</span>
            </Button>
          </div>

          {/* Footer links */}
          <div className="text-center text-sm text-gray-600">
            <span>Bạn mới sử dụng Lalamove? </span>
            <a href="/auth/signup" className="text-orange-500 font-semibold hover:underline">
              Tạo tài khoản miễn phí ngay
            </a>
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
  )
}
