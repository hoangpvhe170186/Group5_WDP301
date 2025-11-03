"use client"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Truck,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Edit,
  Download,
} from "lucide-react"

interface DriverDetailProps {
  carrierId?: string
  onBack: () => void
}

export default function DriverDetail({ carrierId = "DRV001", onBack }: DriverDetailProps) {
  // Mock data - In real app, fetch based on carrierId
  const carrier = {
    id: "DRV001",
    fullName: "Nguyễn Văn A",
    avatar: "🚗",
    email: "nguyenvana@email.com",
    phone: "0912345678",
    licenseNumber: "A123456",
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    status: "active" as const,
    rating: 4.8,
    joinDate: "2023-06-15",
    lastActive: "2024-01-15 14:30",
    earnings: 45600000,

    // Performance
    totalTrips: 245,
    completedTrips: 243,
    cancelledTrips: 2,
    averageRating: 4.8,
    completionRate: 99.2,

    // Vehicle
    vehicle: {
      plate: "29A-12345",
      model: "Hyundai H100",
      year: 2022,
      color: "Trắng",
      capacity: "2.5 tấn",
      lastInspection: "2024-01-10",
    },

    // Documents
    documents: {
      license: { status: "valid", expireDate: "2025-06-15" },
      insurance: { status: "valid", expireDate: "2024-12-31" },
      inspection: { status: "valid", expireDate: "2024-03-15" },
    },
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "bg-green-100", text: "text-green-800", badge: "bg-green-50" }
      case "inactive":
        return { bg: "bg-gray-100", text: "text-gray-800", badge: "bg-gray-50" }
      case "suspended":
        return { bg: "bg-red-100", text: "text-red-800", badge: "bg-red-50" }
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", badge: "bg-gray-50" }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Hoạt động"
      case "inactive":
        return "Không hoạt động"
      case "suspended":
        return "Bị khóa"
      default:
        return "Không xác định"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5" />
      case "inactive":
        return <AlertCircle className="w-5 h-5" />
      case "suspended":
        return <AlertCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const statusColors = getStatusColor(carrier.status)

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Quay lại</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{carrier.fullName}</h1>
            <p className="text-sm text-gray-500">ID: {carrier.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium">
            <Edit className="w-4 h-4" />
            Sửa
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium">
            <Download className="w-4 h-4" />
            Xuất
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Carrier Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carrier Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin tài xế</h2>

            {/* Status Badge */}
            <div className="mb-6 flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${statusColors.badge}`}>
                {getStatusIcon(carrier.status)}
                <span className={`text-sm font-medium ${statusColors.text}`}>{getStatusText(carrier.status)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold text-gray-900">{carrier.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({carrier.totalTrips} chuyến)</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className="text-gray-900 font-medium">{carrier.email}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  <Phone className="w-4 h-4" />
                  Số điện thoại
                </label>
                <p className="text-gray-900 font-medium">{carrier.phone}</p>
              </div>

              {/* License Number */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  <FileText className="w-4 h-4" />
                  Số GPLX
                </label>
                <p className="text-gray-900 font-medium">{carrier.licenseNumber}</p>
              </div>

              {/* Address */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  <MapPin className="w-4 h-4" />
                  Địa chỉ
                </label>
                <p className="text-gray-900 font-medium">{carrier.address}</p>
              </div>

              {/* Join Date */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  <Calendar className="w-4 h-4" />
                  Ngày tham gia
                </label>
                <p className="text-gray-900 font-medium">{carrier.joinDate}</p>
              </div>

              {/* Last Active */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  <Clock className="w-4 h-4" />
                  Hoạt động cuối
                </label>
                <p className="text-gray-900 font-medium">{carrier.lastActive}</p>
              </div>
            </div>
          </div>

          {/* Performance Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Hiệu suất
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Trips */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-medium mb-1">Tổng chuyến</p>
                <p className="text-2xl font-bold text-blue-600">{carrier.totalTrips}</p>
                <p className="text-xs text-gray-500 mt-2">Chuyến giao dịch</p>
              </div>

              {/* Completed Trips */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-medium mb-1">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">{carrier.completedTrips}</p>
                <p className="text-xs text-gray-500 mt-2">Chuyến thành công</p>
              </div>

              {/* Completion Rate */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-medium mb-1">Tỷ lệ hoàn thành</p>
                <p className="text-2xl font-bold text-orange-600">{carrier.completionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-2">Chất lượng dịch vụ</p>
              </div>

              {/* Earnings */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-medium mb-1">Doanh thu</p>
                <p className="text-2xl font-bold text-purple-600">₫{(carrier.earnings / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-gray-500 mt-2">Tổng thu nhập</p>
              </div>
            </div>
          </div>

          {/* Vehicle Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" />
              Thông tin xe
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Plate */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Biển số xe</p>
                <p className="text-lg font-bold text-gray-900">{carrier.vehicle.plate}</p>
              </div>

              {/* Vehicle Model */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Model</p>
                <p className="text-lg font-bold text-gray-900">{carrier.vehicle.model}</p>
              </div>

              {/* Year */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Năm sản xuất</p>
                <p className="text-lg font-bold text-gray-900">{carrier.vehicle.year}</p>
              </div>

              {/* Color */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Màu sắc</p>
                <p className="text-lg font-bold text-gray-900">{carrier.vehicle.color}</p>
              </div>

              {/* Capacity */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tải trọng</p>
                <p className="text-lg font-bold text-gray-900">{carrier.vehicle.capacity}</p>
              </div>

              {/* Last Inspection */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Kiểm định cuối</p>
                <p className="text-lg font-bold text-gray-900">{carrier.vehicle.lastInspection}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Documents & Stats */}
        <div className="space-y-6">
          {/* Documents Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tài liệu</h2>

            <div className="space-y-3">
              {/* License */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Bằng lái</p>
                  <p className="text-xs text-gray-500">Hết hạn: {carrier.documents.license.expireDate}</p>
                </div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Hợp lệ</span>
                </div>
              </div>

              {/* Insurance */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Bảo hiểm</p>
                  <p className="text-xs text-gray-500">Hết hạn: {carrier.documents.insurance.expireDate}</p>
                </div>
                <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Sắp hết</span>
                </div>
              </div>

              {/* Inspection */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Kiểm định</p>
                  <p className="text-xs text-gray-500">Hết hạn: {carrier.documents.inspection.expireDate}</p>
                </div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Hợp lệ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt nhanh</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Đánh giá trung bình</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-gray-900">{carrier.averageRating}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Chuyến đã huỷ</span>
                <span className="font-semibold text-gray-900">{carrier.cancelledTrips}</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${carrier.completionRate}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 text-right">Tỷ lệ hoàn thành: {carrier.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
