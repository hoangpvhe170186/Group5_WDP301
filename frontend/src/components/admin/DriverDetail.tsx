"use client"
import {
  ArrowLeft,
  Mail,
  Phone,
  Truck,
  Star,
  Calendar,
  MapPin,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  CreditCard,
  FileText,
  Ban,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import { adminApi } from "@/services/admin.service";

interface CarrierDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  vehiclePlate: string;
  status: "Active" | "Inactive" | "Banned";
  rating: number;
  totalTrips: number;
  completedTrips: number;
  joinDate: string;
  lastActive: string;
  earnings: number;
  commissionPaid: number;
  avatar?: string;
  banReason?: string;
  vehicle: {
    plate: string;
    type: string;
    capacity: number;
    status: string;
    registrationDate: string;
    insurance: string;
  };
  currentOrders: Array<{
    id: string;
    orderCode: string;
    status: string;
    pickupAddress: string;
    deliveryAddress: string;
    estimatedDelivery: string;
    customerName: string;
    customerPhone: string;
  }>;
  recentOrders: Array<{
    id: string;
    orderCode: string;
    status: string;
    pickupAddress: string;
    deliveryAddress: string;
    completedAt: string;
    revenue: number;
    commission: number;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    customerName: string;
    createdAt: string;
    orderCode: string;
  }>;
  reports: Array<{
    id: string;
    type: string;
    description: string;
    status: string;
    reporterName: string;
    createdAt: string;
    resolvedAt?: string;
  }>;
  financials: {
    totalEarnings: number;
    commissionPaid: number;
    pendingCommission: number;
    commissionRate: number;
    lastPayout: string;
    nextPayout: string;
  };
}

interface DriverDetailProps {
  carrierId?: string;
  onBack: () => void;
}

export default function DriverDetail({ carrierId, onBack }: DriverDetailProps) {
  const [carrier, setCarrier] = useState<CarrierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    if (carrierId) {
      fetchCarrierDetail();
    }
  }, [carrierId]);

  const fetchCarrierDetail = async () => {
    try {
      setLoading(true);
      // Mock data - trong thực tế sẽ gọi API
      const mockCarrier: CarrierDetail = {
        id: carrierId || "CAR001",
        fullName: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        phone: "0912345678",
        licenseNumber: "GPLX-123456",
        vehiclePlate: "29A-12345",
        status: "Active",
        rating: 4.5,
        totalTrips: 156,
        completedTrips: 148,
        joinDate: "2023-01-15",
        lastActive: new Date().toISOString(),
        earnings: 45000000,
        commissionPaid: 9000000,
        banReason: "",
        vehicle: {
          plate: "29A-12345",
          type: "Truck - 2.5 tấn",
          capacity: 2500,
          status: "Available",
          registrationDate: "2022-12-01",
          insurance: "Bảo hiểm TNDS đến 31/12/2024"
        },
        currentOrders: [
          {
            id: "ORD001",
            orderCode: "ORD-2024-001",
            status: "ON_THE_WAY",
            pickupAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
            deliveryAddress: "456 Lê Lợi, Quận 1, TP.HCM",
            estimatedDelivery: "2024-01-20T15:30:00",
            customerName: "Trần Văn B",
            customerPhone: "0912345679"
          },
          {
            id: "ORD002",
            orderCode: "ORD-2024-002",
            status: "ASSIGNED",
            pickupAddress: "789 Lý Tự Trọng, Quận 1, TP.HCM",
            deliveryAddress: "321 Hai Bà Trưng, Quận 3, TP.HCM",
            estimatedDelivery: "2024-01-20T16:00:00",
            customerName: "Lê Thị C",
            customerPhone: "0912345680"
          }
        ],
        recentOrders: [
          {
            id: "ORD003",
            orderCode: "ORD-2024-003",
            status: "DELIVERED",
            pickupAddress: "111 Pasteur, Quận 1",
            deliveryAddress: "222 Nguyễn Trãi, Quận 5",
            completedAt: "2024-01-19T14:20:00",
            revenue: 350000,
            commission: 70000
          },
          {
            id: "ORD004",
            orderCode: "ORD-2024-004",
            status: "DELIVERED",
            pickupAddress: "333 Võ Văn Tần, Quận 3",
            deliveryAddress: "444 Lê Văn Sỹ, Quận 3",
            completedAt: "2024-01-19T11:15:00",
            revenue: 280000,
            commission: 56000
          }
        ],
        reviews: [
          {
            id: "REV001",
            rating: 5,
            comment: "Rất tốt, giao hàng nhanh và thái độ thân thiện",
            customerName: "Trần Văn B",
            createdAt: "2024-01-19",
            orderCode: "ORD-2024-003"
          },
          {
            id: "REV002",
            rating: 4,
            comment: "Tốt, đúng giờ, đóng gói cẩn thận",
            customerName: "Lê Thị C",
            createdAt: "2024-01-18",
            orderCode: "ORD-2024-004"
          },
          {
            id: "REV003",
            rating: 3,
            comment: "Giao hàng hơi trễ 15 phút",
            customerName: "Phạm Văn D",
            createdAt: "2024-01-17",
            orderCode: "ORD-2024-005"
          }
        ],
        reports: [
          {
            id: "REP001",
            type: "Delay",
            description: "Giao hàng trễ 30 phút so với dự kiến",
            status: "Resolved",
            reporterName: "Nguyễn Thị E",
            createdAt: "2024-01-10",
            resolvedAt: "2024-01-11"
          }
        ],
        financials: {
          totalEarnings: 45000000,
          commissionPaid: 9000000,
          pendingCommission: 1500000,
          commissionRate: 20,
          lastPayout: "2024-01-15",
          nextPayout: "2024-02-01"
        }
      };
      
      setCarrier(mockCarrier);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải chi tiết carrier");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBanCarrier = async () => {
    if (!carrier || !banReason.trim()) return;

    try {
      await adminApi.updateUser(carrier.id, {
        status: "Banned",
        banReason: banReason.trim()
      });
      
      setCarrier({
        ...carrier,
        status: "Banned",
        banReason: banReason.trim()
      });
      
      setShowBanModal(false);
      setBanReason("");
    } catch (err: any) {
      setError("Lỗi khi khóa carrier");
      console.error(err);
    }
  };

  const handleUnbanCarrier = async () => {
    if (!carrier) return;

    try {
      await adminApi.updateUser(carrier.id, {
        status: "Active",
        banReason: ""
      });
      
      setCarrier({
        ...carrier,
        status: "Active",
        banReason: ""
      });
    } catch (err: any) {
      setError("Lỗi khi mở khóa carrier");
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      case "Banned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Active":
        return "Hoạt động";
      case "Inactive":
        return "Không hoạt động";
      case "Banned":
        return "Bị khóa";
      default:
        return "Không xác định";
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "ON_THE_WAY":
        return "bg-blue-100 text-blue-800";
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case "ON_THE_WAY":
        return "Đang giao";
      case "ASSIGNED":
        return "Đã phân công";
      case "DELIVERED":
        return "Đã giao";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Investigating":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải thông tin carrier...</div>
      </div>
    );
  }

  if (error || !carrier) {
    return (
      <div className="text-center text-red-600">
        <div>❌ {error || "Không tìm thấy thông tin carrier"}</div>
        <button
          onClick={onBack}
          className="mt-4 text-orange-600 hover:text-orange-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Khóa Carrier</h3>
            <p className="text-gray-600 mb-4">Vui lòng nhập lý do khóa carrier {carrier.fullName}:</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do khóa..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleBanCarrier}
                disabled={!banReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
              >
                Xác nhận khóa
              </button>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết Carrier</h1>
            <p className="text-gray-600">ID: {carrier.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              carrier.status
            )}`}
          >
            {carrier.status === "Active" && <CheckCircle className="w-4 h-4 mr-1" />}
            {carrier.status === "Banned" && <Ban className="w-4 h-4 mr-1" />}
            {getStatusText(carrier.status)}
          </span>
          {carrier.status === "Banned" ? (
            <button
              onClick={handleUnbanCarrier}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mở khóa
            </button>
          ) : (
            <button
              onClick={() => setShowBanModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
            >
              <Ban className="w-4 h-4" />
              Khóa tài khoản
            </button>
          )}
        </div>
      </div>

      {carrier.banReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800 font-medium">Lý do khóa:</span>
            <span className="text-red-700 ml-2">{carrier.banReason}</span>
          </div>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start space-x-6">
          <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
            {carrier.avatar ? (
              <img src={carrier.avatar} alt={carrier.fullName} className="h-20 w-20 rounded-full" />
            ) : (
              <User className="w-10 h-10 text-orange-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">{carrier.fullName}</h2>
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{carrier.rating.toFixed(1)}</span>
                <span className="text-gray-500">({carrier.reviews.length} đánh giá)</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {carrier.email}
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {carrier.phone}
              </div>
              <div className="flex items-center text-gray-600">
                <Truck className="w-4 h-4 mr-2" />
                {carrier.vehiclePlate}
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Tham gia: {new Date(carrier.joinDate).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "overview", name: "Tổng quan", icon: TrendingUp },
              { id: "orders", name: "Đơn hàng", icon: Package },
              { id: "reviews", name: "Đánh giá", icon: Star },
              { id: "reports", name: "Báo cáo", icon: AlertTriangle },
              { id: "financial", name: "Tài chính", icon: CreditCard },
              { id: "vehicle", name: "Thông tin xe", icon: Truck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Tổng quan */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Thống kê */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Thống kê hoạt động</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{carrier.totalTrips}</div>
                    <div className="text-sm text-gray-600">Tổng chuyến</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{carrier.completedTrips}</div>
                    <div className="text-sm text-gray-600">Chuyến hoàn thành</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {carrier.totalTrips > 0 ? ((carrier.completedTrips / carrier.totalTrips) * 100).toFixed(0) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Tỷ lệ hoàn thành</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      ₫{(carrier.earnings / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-gray-600">Tổng doanh thu</div>
                  </div>
                </div>

                {/* Đơn hàng hiện tại */}
                <div>
                  <h4 className="font-semibold mb-3">Đơn hàng hiện tại</h4>
                  <div className="space-y-3">
                    {carrier.currentOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{order.orderCode}</div>
                            <div className="text-sm text-gray-600">{order.customerName}</div>
                          </div>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(
                              order.status
                            )}`}
                          >
                            {getOrderStatusText(order.status)}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">{order.pickupAddress}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">{order.deliveryAddress}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Dự kiến: {new Date(order.estimatedDelivery).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Đánh giá gần nhất */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Đánh giá gần nhất</h3>
                <div className="space-y-4">
                  {carrier.reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{review.customerName}</div>
                          <div className="text-sm text-gray-600">{review.orderCode}</div>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="ml-1 font-medium">{review.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">{review.comment}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Đơn hàng */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Đơn hàng hiện tại */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Đơn hàng hiện tại</h3>
                <div className="space-y-4">
                  {carrier.currentOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium text-lg">{order.orderCode}</div>
                          <div className="text-sm text-gray-600">
                            Khách hàng: {order.customerName} • {order.customerPhone}
                          </div>
                        </div>
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getOrderStatusColor(
                            order.status
                          )}`}
                        >
                          {getOrderStatusText(order.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-start mb-2">
                            <MapPin className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium">Điểm lấy hàng</div>
                              <div className="text-sm text-gray-600">{order.pickupAddress}</div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-start mb-2">
                            <MapPin className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium">Điểm giao hàng</div>
                              <div className="text-sm text-gray-600">{order.deliveryAddress}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Dự kiến giao: {new Date(order.estimatedDelivery).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Đơn hàng gần đây */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Đơn hàng gần đây</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Mã đơn</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Doanh thu</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Hoa hồng</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {carrier.recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderCode}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(
                                order.status
                              )}`}
                            >
                              {getOrderStatusText(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">₫{order.revenue.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-green-600">₫{order.commission.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(order.completedAt).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Đánh giá */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tất cả đánh giá ({carrier.reviews.length})</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Điểm trung bình:</span>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="ml-1 font-bold text-lg">{carrier.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {carrier.reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-lg">{review.customerName}</div>
                        <div className="text-sm text-gray-600">Đơn hàng: {review.orderCode}</div>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{review.comment}</p>
                    <div className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Báo cáo */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Lịch sử báo cáo ({carrier.reports.length})</h3>
              
              {carrier.reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <div>Không có báo cáo nào</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {carrier.reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium text-lg">{report.type}</div>
                          <div className="text-sm text-gray-600">
                            Người báo cáo: {report.reporterName}
                          </div>
                        </div>
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getReportStatusColor(
                            report.status
                          )}`}
                        >
                          {report.status === "Resolved" ? "Đã xử lý" : 
                           report.status === "Pending" ? "Đang chờ" : "Đang điều tra"}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{report.description}</p>
                      
                      <div className="flex justify-between text-sm text-gray-500">
                        <div>Ngày tạo: {new Date(report.createdAt).toLocaleString('vi-VN')}</div>
                        {report.resolvedAt && (
                          <div>Ngày xử lý: {new Date(report.resolvedAt).toLocaleString('vi-VN')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Tài chính */}
          {activeTab === "financial" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Thông tin tài chính</h3>
              
              {/* Tổng quan tài chính */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-600 font-medium">Tổng doanh thu</div>
                      <div className="text-2xl font-bold text-blue-700">
                        ₫{(carrier.financials.totalEarnings / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-green-600 font-medium">Đã trả hoa hồng</div>
                      <div className="text-2xl font-bold text-green-700">
                        ₫{(carrier.financials.commissionPaid / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <CreditCard className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-orange-600 font-medium">Hoa hồng đang chờ</div>
                      <div className="text-2xl font-bold text-orange-700">
                        ₫{(carrier.financials.pendingCommission / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <FileText className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Chi tiết */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Thông tin thanh toán</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tỷ lệ hoa hồng:</span>
                      <span className="font-medium">{carrier.financials.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lần thanh toán gần nhất:</span>
                      <span className="font-medium">
                        {new Date(carrier.financials.lastPayout).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lần thanh toán tiếp theo:</span>
                      <span className="font-medium">
                        {new Date(carrier.financials.nextPayout).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Phân tích hiệu suất</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Doanh thu trung bình/chuyến:</span>
                      <span className="font-medium">
                        ₫{carrier.totalTrips > 0 ? (carrier.earnings / carrier.totalTrips).toLocaleString() : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hoa hồng trung bình/chuyến:</span>
                      <span className="font-medium">
                        ₫{carrier.totalTrips > 0 ? (carrier.commissionPaid / carrier.totalTrips).toLocaleString() : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tỷ lệ hoàn thành:</span>
                      <span className="font-medium text-green-600">
                        {carrier.totalTrips > 0 ? ((carrier.completedTrips / carrier.totalTrips) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Thông tin xe */}
          {activeTab === "vehicle" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Thông tin phương tiện</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Thông tin cơ bản</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biển số xe:</span>
                      <span className="font-medium">{carrier.vehicle.plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loại xe:</span>
                      <span className="font-medium">{carrier.vehicle.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tải trọng:</span>
                      <span className="font-medium">{carrier.vehicle.capacity} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className={`font-medium ${
                        carrier.vehicle.status === "Available" ? "text-green-600" : "text-blue-600"
                      }`}>
                        {carrier.vehicle.status === "Available" ? "Sẵn sàng" : "Đang sử dụng"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Thông tin đăng ký & Bảo hiểm</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày đăng ký:</span>
                      <span className="font-medium">
                        {new Date(carrier.vehicle.registrationDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bảo hiểm:</span>
                      <span className="font-medium">{carrier.vehicle.insurance}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tình trạng xe */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-semibold mb-4">Tình trạng hiện tại</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="font-medium text-green-700">Đạt tiêu chuẩn</div>
                    <div className="text-sm text-green-600">Kiểm định an toàn</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="font-medium text-blue-700">Đầy đủ giấy tờ</div>
                    <div className="text-sm text-blue-600">Giấy phép đầy đủ</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Truck className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <div className="font-medium text-orange-700">Hoạt động tốt</div>
                    <div className="text-sm text-orange-600">Tình trạng kỹ thuật</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}