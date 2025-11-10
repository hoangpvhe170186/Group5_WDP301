"use client"
import {
  ArrowLeft,
  Mail,
  Phone,
  Star,
  Calendar,
  MapPin,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Ban,
  CheckCircle2,
  User,
  CreditCard,
  FileText,
  DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import { adminApi, getAuthToken, type User as UserType } from "@/services/admin.service";
import api from "@/lib/axios";

// ====== Configs ======
const BASE_SALARY_VND = 5_000_000;
const KPI_MIN_ORDERS = 10;
const COMMISSION_RATE = 0.02;
const KPI_EARLY_DEADLINE_DAY = 20;
const POINT_VALUE_VND = 100_000;
const POINTS_PER_EXTRA_ORDER = 1;
const EARLY_KPI_BONUS_POINTS = 5;

// ====== Types ======
type OrderLite = {
  id: string;
  code: string;
  status: string;
  price: number;
  createdAt: string;
  completedAt?: string | null;
  pickupAddress: string;
  deliveryAddress: string;
  sellerId?: string | null;
};

type OrderTrackingLite = {
  order_id: string;
  status: string;
  createdAt: string;
};

type SellerFinancials = {
  totalEarnings: number;
  commissionPaid: number;
  pendingCommission: number;
  baseAdjusted: number;
  bonusPoints: number;
  bonusSalary: number;
  commission: number;
  totalPayout: number;
  completedOrders: number;
  totalCompletedValue: number;
};

interface SellerDetailProps {
  sellerId?: string;
  onBack: () => void;
}

function formatCurrencyVND(n: number) {
  try {
    return n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  } catch {
    return `${Math.round(n)} VND`;
  }
}

function isSameMonth(dateStr: string, year: number, monthIndex: number) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === monthIndex;
}

function calcPayout3P(
  completedOrders: number,
  totalCompletedValue: number,
  completedDates: string[]
): { commission: number; baseAdjusted: number; bonusPoints: number; bonusSalary: number; totalPayout: number } {
  const commission = totalCompletedValue * COMMISSION_RATE;
  const baseAdjusted =
    completedOrders >= KPI_MIN_ORDERS
      ? BASE_SALARY_VND
      : Math.floor(BASE_SALARY_VND * (completedOrders / KPI_MIN_ORDERS));

  let bonusPoints = 0;
  if (completedOrders >= KPI_MIN_ORDERS) {
    const sortedDates = completedDates
      .filter(Boolean)
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (sortedDates.length >= KPI_MIN_ORDERS) {
      const kpiCompletionDate = sortedDates[KPI_MIN_ORDERS - 1];
      if (kpiCompletionDate.getDate() <= KPI_EARLY_DEADLINE_DAY) {
        bonusPoints += EARLY_KPI_BONUS_POINTS;
      }
    }
    
    if (completedOrders > KPI_MIN_ORDERS) {
      bonusPoints += (completedOrders - KPI_MIN_ORDERS) * POINTS_PER_EXTRA_ORDER;
    }
  }
  
  const bonusSalary = bonusPoints * POINT_VALUE_VND;
  const totalPayout = baseAdjusted + commission + bonusSalary;
  
  return { commission, baseAdjusted, bonusPoints, bonusSalary, totalPayout };
}

export default function SellerDetail({ sellerId, onBack }: SellerDetailProps) {
  const [seller, setSeller] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  
  // Data
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [reviews, setReviews] = useState<Array<{
    id: string;
    rating: number;
    comment: string;
    customerName: string;
    createdAt: string;
    orderCode: string;
  }>>([]);
  const [financials, setFinancials] = useState<SellerFinancials | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    if (sellerId) {
      fetchSellerDetail();
    }
  }, [sellerId, selectedYear, selectedMonth]);

  const fetchSellerDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Fetch seller info
      const sellerData = await adminApi.getUserDetail(sellerId!);
      setSeller(sellerData);

      // 2) Fetch all orders
      const token = getAuthToken();
      const { data: allOrdersData } = await api.get("/users/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const normalized: OrderLite[] = (allOrdersData || []).map((o: any) => ({
        id: String(o._id),
        code: o.orderCode || "",
        status: o.status || "",
        price: Number(o.total_price || 0),
        createdAt: o.createdAt || "",
        completedAt: null,
        pickupAddress: o.pickup_address || "",
        deliveryAddress: o.delivery_address || "",
        sellerId: o.seller_id ? String(o.seller_id._id || o.seller_id) : null,
      }));

      // 3) Fetch tracking for completed orders
      for (const order of normalized) {
        if (order.sellerId === sellerId && order.status === "COMPLETED") {
          try {
            const { data: trackingData } = await api.get(`/order-tracking/${order.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const trackings: OrderTrackingLite[] = (trackingData.trackings || []).map((t: any) => ({
              order_id: String(t.order_id || order.id),
              status: t.status || "",
              createdAt: t.createdAt || "",
            }));
            const completedTracking = trackings.find((t) => t.status === "COMPLETED");
            if (completedTracking) {
              order.completedAt = completedTracking.createdAt;
            }
          } catch (err) {
            console.warn(`Failed to fetch tracking for order ${order.id}:`, err);
          }
        }
      }

      setOrders(normalized);

      // 4) Fetch reviews/feedbacks
      const sellerOrders = normalized.filter((o) => o.sellerId === sellerId && o.status === "COMPLETED");
      const reviewsData: typeof reviews = [];
      for (const order of sellerOrders) {
        try {
          const { data } = await api.get(`/users/feedback/order/${order.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (data && typeof data.rating === "number") {
            reviewsData.push({
              id: order.id,
              rating: Number(data.rating),
              comment: data.comment || "Không có nhận xét",
              customerName: data.customerName || "Khách hàng",
              createdAt: data.createdAt || order.completedAt || order.createdAt,
              orderCode: order.code,
            });
          }
        } catch {}
      }
      setReviews(reviewsData);

      // 5) Calculate financials using 3P formula
      const completed = sellerOrders.filter((o) => {
        const completionDate = o.completedAt || o.createdAt;
        return isSameMonth(completionDate, selectedYear, selectedMonth);
      });
      const completedDates = completed.map((o) => o.completedAt || o.createdAt).filter(Boolean);
      const totalValue = completed.reduce((sum, o) => sum + (o.price || 0), 0);
      const { commission, baseAdjusted, bonusPoints, bonusSalary, totalPayout } = calcPayout3P(
        completed.length,
        totalValue,
        completedDates
      );

      setFinancials({
        totalEarnings: totalValue,
        commissionPaid: 0, // TODO: fetch from payment history
        pendingCommission: commission,
        baseAdjusted,
        bonusPoints,
        bonusSalary,
        commission,
        totalPayout,
        completedOrders: completed.length,
        totalCompletedValue: totalValue,
      });
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải chi tiết seller");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBanSeller = async () => {
    if (!seller || !banReason.trim()) return;

    try {
      await adminApi.updateUser(seller.id, {
        status: "Banned",
        banReason: banReason.trim()
      });
      
      setSeller({
        ...seller,
        status: "Banned",
        banReason: banReason.trim()
      });
      
      setShowBanModal(false);
      setBanReason("");
    } catch (err: any) {
      setError("Lỗi khi khóa seller");
      console.error(err);
    }
  };

  const handleUnbanSeller = async () => {
    if (!seller) return;

    try {
      await adminApi.updateUser(seller.id, {
        status: "Active",
        banReason: ""
      });
      
      setSeller({
        ...seller,
        status: "Active",
        banReason: ""
      });
    } catch (err: any) {
      setError("Lỗi khi mở khóa seller");
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
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "ON_THE_WAY":
        return "bg-blue-100 text-blue-800";
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Đã hoàn thành";
      case "ON_THE_WAY":
        return "Đang giao";
      case "ASSIGNED":
        return "Đã phân công";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải thông tin seller...</div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="text-center text-red-600">
        <div>❌ {error || "Không tìm thấy thông tin seller"}</div>
        <button
          onClick={onBack}
          className="mt-4 text-orange-600 hover:text-orange-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const sellerOrders = orders.filter((o) => o.sellerId === seller.id);
  const currentOrders = sellerOrders.filter((o) => !["COMPLETED", "CANCELLED", "DECLINED"].includes(o.status));
  const recentOrders = sellerOrders
    .filter((o) => o.status === "COMPLETED")
    .sort((a, b) => {
      const dateA = a.completedAt || a.createdAt;
      const dateB = b.completedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 10);
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Khóa Seller</h3>
            <p className="text-gray-600 mb-4">Vui lòng nhập lý do khóa seller {seller.fullName}:</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do khóa..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleBanSeller}
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
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết Seller</h1>
            <p className="text-gray-600">ID: {seller.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              seller.status
            )}`}
          >
            {seller.status === "Active" && <CheckCircle className="w-4 h-4 mr-1" />}
            {seller.status === "Banned" && <Ban className="w-4 h-4 mr-1" />}
            {getStatusText(seller.status)}
          </span>
          {seller.status === "Banned" ? (
            <button
              onClick={handleUnbanSeller}
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

      {seller.banReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800 font-medium">Lý do khóa:</span>
            <span className="text-red-700 ml-2">{seller.banReason}</span>
          </div>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start space-x-6">
          <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
            {seller.avatar ? (
              <img src={seller.avatar} alt={seller.fullName} className="h-20 w-20 rounded-full" />
            ) : (
              <User className="w-10 h-10 text-orange-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">{seller.fullName}</h2>
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-gray-500">({reviews.length} đánh giá)</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {seller.email}
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {seller.phone || "—"}
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Tham gia: {new Date(seller.createdAt).toLocaleDateString('vi-VN')}
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
              { id: "financial", name: "Tài chính", icon: CreditCard },
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
                    <div className="text-2xl font-bold text-gray-900">{sellerOrders.length}</div>
                    <div className="text-sm text-gray-600">Tổng đơn</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {sellerOrders.filter((o) => o.status === "COMPLETED").length}
                    </div>
                    <div className="text-sm text-gray-600">Đơn hoàn thành</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{currentOrders.length}</div>
                    <div className="text-sm text-gray-600">Đơn đang thực hiện</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {financials ? formatCurrencyVND(financials.totalPayout) : "—"}
                    </div>
                    <div className="text-sm text-gray-600">Tổng payout</div>
                  </div>
                </div>

                {/* Đơn hàng hiện tại */}
                <div>
                  <h4 className="font-semibold mb-3">Đơn hàng hiện tại</h4>
                  <div className="space-y-3">
                    {currentOrders.length > 0 ? (
                      currentOrders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">{order.code}</div>
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
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">Không có đơn hàng đang thực hiện</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Đánh giá gần nhất */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Đánh giá gần nhất</h3>
                <div className="space-y-4">
                  {reviews.slice(0, 3).length > 0 ? (
                    reviews.slice(0, 3).map((review) => (
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
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">Chưa có đánh giá</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Đơn hàng */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Period selector */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i} value={i}>
                        Tháng {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Đơn hàng hiện tại */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Đơn hàng hiện tại</h3>
                <div className="space-y-4">
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium text-lg">{order.code}</div>
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
                          Giá trị: {formatCurrencyVND(order.price)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">Không có đơn hàng đang thực hiện</div>
                  )}
                </div>
              </div>

              {/* Đơn hàng gần đây */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Đơn hàng đã hoàn thành</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Mã đơn</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Giá trị</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentOrders.length > 0 ? (
                        recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.code}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(
                                  order.status
                                )}`}
                              >
                                {getOrderStatusText(order.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatCurrencyVND(order.price)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {order.completedAt
                                ? new Date(order.completedAt).toLocaleString('vi-VN')
                                : new Date(order.createdAt).toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            Không có đơn hàng đã hoàn thành
                          </td>
                        </tr>
                      )}
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
                <h3 className="text-lg font-semibold">Tất cả đánh giá ({reviews.length})</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Điểm trung bình:</span>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="ml-1 font-bold text-lg">{avgRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">Chưa có đánh giá</div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Tài chính */}
          {activeTab === "financial" && financials && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Thông tin tài chính</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i} value={i}>
                          Tháng {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Tổng quan tài chính */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-600 font-medium">Tổng giá trị đơn</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {formatCurrencyVND(financials.totalCompletedValue)}
                      </div>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-green-600 font-medium">P3: Hoa hồng (2%)</div>
                      <div className="text-2xl font-bold text-green-700">
                        {formatCurrencyVND(financials.commission)}
                      </div>
                    </div>
                    <CreditCard className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-orange-600 font-medium">Tổng Payout</div>
                      <div className="text-2xl font-bold text-orange-700">
                        {formatCurrencyVND(financials.totalPayout)}
                      </div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Chi tiết công thức 3P */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Phân tích công thức 3P</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đơn hoàn thành:</span>
                      <span className="font-medium">{financials.completedOrders} / {KPI_MIN_ORDERS} (KPI)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">P1 - Lương cứng:</span>
                      <span className="font-medium">{formatCurrencyVND(financials.baseAdjusted)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">P2 - Điểm thưởng:</span>
                      <span className="font-medium">{financials.bonusPoints} điểm = {formatCurrencyVND(financials.bonusSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">P3 - Hoa hồng (2%):</span>
                      <span className="font-medium">{formatCurrencyVND(financials.commission)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-semibold">Tổng lương:</span>
                      <span className="font-bold text-lg">{formatCurrencyVND(financials.totalPayout)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Thông tin thanh toán</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đã trả:</span>
                      <span className="font-medium">{formatCurrencyVND(financials.commissionPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đang chờ:</span>
                      <span className="font-medium text-orange-600">{formatCurrencyVND(financials.pendingCommission)}</span>
                    </div>
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

