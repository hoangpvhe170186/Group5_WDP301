

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import Image from "next/image"

export default function VerifyOtpPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Get email from sessionStorage
    const storedEmail = sessionStorage.getItem("auth_email")
    if (!storedEmail) {
      router.push("/auth/login")
      return
    }
    setEmail(storedEmail)

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1)
    }

    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = [...otp]
    pastedData.split("").forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char
      }
    })
    setOtp(newOtp)

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5)
    inputRefs.current[lastIndex]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join("")

    if (otpCode.length !== 6) {
      return
    }

    setIsLoading(true)

    // TODO: Call API to verify OTP
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Clear stored email
    sessionStorage.removeItem("auth_email")

    // Navigate to dashboard or home
    router.push("/")
  }

  const handleResend = async () => {
    if (!canResend) return

    setCanResend(false)
    setCountdown(60)

    // TODO: Call API to resend OTP
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Restart countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-50 to-orange-100 items-center justify-center p-12">
        <div className="relative w-full max-w-md">
          <Image
            src="/orange-delivery-vehicles-illustration-isometric.jpg"
            alt="Delivery vehicles"
            width={400}
            height={400}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Right side - OTP form */}
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

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Xác thực email</h1>
            <p className="text-gray-600">Chúng tôi đã gửi mã OTP đến email</p>
            <p className="text-orange-500 font-semibold">{email}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                ))}
              </div>

              <div className="text-center text-sm text-gray-600">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-orange-500 font-semibold hover:underline"
                  >
                    Gửi lại mã OTP
                  </button>
                ) : (
                  <span>
                    Gửi lại mã sau <span className="font-semibold text-orange-500">{countdown}s</span>
                  </span>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.join("").length !== 6}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base disabled:opacity-50"
            >
              {isLoading ? "Đang xác thực..." : "Xác thực"}
            </Button>
          </form>

          {/* Back to login */}
          <div className="text-center">
            <button onClick={() => router.push("/auth/login")} className="text-sm text-gray-600 hover:text-orange-500">
              ← Quay lại đăng nhập
            </button>
          </div>

          {/* Footer links */}
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
