"use client"

import type React from "react"
import { useState } from "react"
import { ArrowLeft, AlertCircle } from "lucide-react"

interface Driver {
  id: string
  fullName: string
  email: string
  phone: string
  licenseNumber: string
  address: string
  city: string
  vehicleType: string
  status: "active" | "inactive" | "suspended"
  rating: number
  totalTrips: number
  completedTrips: number
  joinDate: string
  lastActive: string
  earnings: number
  vehicle?: {
    plate: string
    model: string
    year: number
    color: string
    loadCapacity: string
  }
  documents?: {
    license: string
    insurance: string
    inspection: string
  }
}

interface AddDriverPageProps {
  onBack: () => void
  onSubmit: (data: Partial<Driver>) => void
}

export default function AddDriverPage({ onBack, onSubmit }: AddDriverPageProps) {
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    licenseNumber: "",
    address: "",
    city: "Hà Nội",
    vehicleType: "Xe tải nhỏ",
    plate: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    loadCapacity: "",
  })

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (stepNum === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên"
      if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email không hợp lệ"
      if (!formData.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại"
      if (!/^0\d{9,10}$/.test(formData.phone.replace(/[- ]/g, ""))) newErrors.phone = "Số điện thoại không hợp lệ"
      if (!formData.licenseNumber.trim()) newErrors.licenseNumber = "Vui lòng nhập số bằng lái"
      if (!formData.address.trim()) newErrors.address = "Vui lòng nhập địa chỉ"
    }

    if (stepNum === 2) {
      if (!formData.plate.trim()) newErrors.plate = "Vui lòng nhập biển số"
      if (!formData.model.trim()) newErrors.model = "Vui lòng nhập model xe"
      if (formData.year < 1990 || formData.year > new Date().getFullYear()) newErrors.year = "Năm không hợp lệ"
      if (!formData.color.trim()) newErrors.color = "Vui lòng nhập màu sắc"
      if (!formData.loadCapacity.trim()) newErrors.loadCapacity = "Vui lòng nhập tải trọng"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep(2)) {
      const newDriver: Partial<Driver> = {
        id: `DRV${Date.now()}`,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        address: formData.address,
        city: formData.city,
        vehicleType: formData.vehicleType,
        status: "active",
        rating: 5.0,
        totalTrips: 0,
        completedTrips: 0,
        joinDate: new Date().toLocaleDateString("vi-VN"),
        lastActive: new Date().toLocaleDateString("vi-VN"),
        earnings: 0,
        vehicle: {
          plate: formData.plate,
          model: formData.model,
          year: formData.year,
          color: formData.color,
          loadCapacity: formData.loadCapacity,
        },
        documents: {
          license: "Chưa xác nhận",
          insurance: "Chưa xác nhận",
          inspection: "Chưa xác nhận",
        },
      }
      onSubmit(newDriver)
      setStep(1)
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        licenseNumber: "",
        address: "",
        city: "Hà Nội",
        vehicleType: "Xe tải nhỏ",
        plate: "",
        model: "",
        year: new Date().getFullYear(),
        color: "",
        loadCapacity: "",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "year" ? Number.parseInt(value) : value,
    }))
    // Xóa lỗi khi người dùng nhập
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Thêm tài xế mới</h1>
              <p className="text-sm text-gray-600">Bước {step} của 2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Thông tin cơ bản */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Thông tin cá nhân</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Họ và tên */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.fullName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Nhập họ và tên"
                    />
                    {errors.fullName && (
                      <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.fullName}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="example@email.com"
                    />
                    {errors.email && (
                      <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </div>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="0912345678"
                    />
                    {errors.phone && (
                      <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </div>
                    )}
                  </div>

                  {/* Số bằng lái */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số bằng lái <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.licenseNumber ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="123456789"
                    />
                    {errors.licenseNumber && (
                      <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.licenseNumber}
                      </div>
                    )}
                  </div>

                  {/* Địa chỉ */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.address ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="123 Đường ABC, Phường XYZ"
                    />
                    {errors.address && (
                      <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.address}
                      </div>
                    )}
                  </div>

                  {/* Thành phố */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Hải Phòng">Hải Phòng</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  {/* Loại xe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại xe</label>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="Xe tải nhỏ">Xe tải nhỏ</option>
                      <option value="Xe bán tải">Xe bán tải</option>
                      <option value="Xe container">Xe container</option>
                      <option value="Xe chuyên dùng">Xe chuyên dùng</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Button Tiếp tục */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Thông tin xe */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Thông tin phương tiện</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Biển số */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Biển số <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="plate"
                      value={formData.plate}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.plate ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="29A-12345"
                    />
                    {errors.plate && (
                      <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.plate}
                      </div>
                    )}
                  </div>

                  {/* Model xe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model xe <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.model ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Hyundai HD65"
                    />
                    {errors.model && (
                      <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.model}
                      </div>
                    )}
                  </div>

                  {/* Năm sản xuất */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Năm sản xuất <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      min="1990"
                      max={new Date().getFullYear()}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.year ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.year && (
                      <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.year}
                      </div>
                    )}
                  </div>

                  {/* Màu sắc */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Màu sắc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.color ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Trắng / Xám / Xanh"
                    />
                    {errors.color && (
                      <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.color}
                      </div>
                    )}
                  </div>

                  {/* Tải trọng */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tải trọng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="loadCapacity"
                      value={formData.loadCapacity}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        errors.loadCapacity ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="5 tấn / 10 tấn"
                    />
                    {errors.loadCapacity && (
                      <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.loadCapacity}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Thông tin tóm tắt */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Tài xế sẽ được tạo với trạng thái "Hoạt động". Vui lòng kiểm tra và xác nhận
                  tài liệu sau khi tạo.
                </p>
              </div>

              {/* Button Lưu/Quay lại */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Tạo tài xế
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
