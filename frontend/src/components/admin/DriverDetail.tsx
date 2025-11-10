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
import { carrierApi } from "@/services/carrier.service";
import { useParams } from "react-router-dom";

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
  vehicle?: {
    plate: string;
    type: string;
    capacity: number;
    status: string;
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

export default function DriverDetail({ carrierId: carrierIdProp, onBack }: DriverDetailProps) {
  const params = useParams();
  const carrierId = carrierIdProp || (params as any)?.id;
  const [carrier, setCarrier] = useState<CarrierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    if (carrierId) fetchCarrierDetail();
  }, [carrierId]);

  const fetchCarrierDetail = async () => {
    setLoading(true);
    setError(null);

    const getAuthToken = () => {
      if (typeof window === "undefined") return "";
      return (
        localStorage.getItem("auth_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("auth_token") ||
        ""
      );
    };

    const token = getAuthToken();

    const getCarrier = async (id: string) => {
      const tryCalls: Array<() => Promise<any> | undefined> = [
        () => (adminApi as any).getCarrierById?.(id),
        () => (adminApi as any).getCarrier?.(id),
        () => (adminApi as any).getUserById?.(id),
        () => (adminApi as any).getUser?.(id),
        () => (carrierApi as any)?.getById?.(id),
        () => (carrierApi as any)?.getCarrierById?.(id),
      ];

      for (const call of tryCalls) {
        try {
          const res = await call?.();
          if (!res) continue;
          const data = res.data ?? res.user ?? res.carrier ?? res;
          if (data) return data;
        } catch {}
      }

      const routes = [
        `/api/admin/carriers/${id}`,
        `/api/admin/users/${id}`,
        `/api/carriers/${id}`,
        `/api/users/${id}`,
      ];
      
      for (const url of routes) {
        try {
          const headers: Record<string, string> = { 
            'Content-Type': 'application/json'
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const r = await fetch(url, { 
            credentials: "include",
            headers
          });
          if (r.ok) {
            const j = await r.json().catch(() => ({}));
            const data = j?.data ?? j?.user ?? j?.carrier ?? j;
            if (data) return data;
          }
        } catch {}
      }

      return null;
    };

    const getVehicle = async (id: string) => {
      try {
        const v1 = await (adminApi as any).getCarrierVehicle?.(id);
        if (v1?.data || v1?.vehicle || v1) return v1?.data ?? v1?.vehicle ?? v1;
      } catch {}
      try {
        const v2 = await (adminApi as any).getVehicleByCarrier?.(id);
        if (v2?.data || v2?.vehicle || v2) return v2?.data ?? v2?.vehicle ?? v2;
      } catch {}
      try {
        const v3 = await (adminApi as any).listVehicles?.({ carrier_id: id, limit: 100 });
        const arr = v3?.data ?? v3?.vehicles ?? v3 ?? [];
        const found = Array.isArray(arr)
          ? arr.find((x: any) => String(x?.carrier_id?._id ?? x?.carrier_id ?? x?.carrierId) === String(id))
          : null;
        if (found) return found;
      } catch {}
      
      try {
        const headers: Record<string, string> = { 
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const r = await fetch(`/api/vehicles?carrier_id=${id}`, { 
          credentials: "include",
          headers
        });
        if (r.ok) {
          const j = await r.json();
          const arr = j?.data ?? j ?? [];
          return Array.isArray(arr) ? arr.find((x: any) => String(x?.carrier_id) === String(id)) : null;
        }
      } catch {}
      return null;
    };

    const getOrders = async (id: string) => {
      try {
        const o1 = await (adminApi as any).getCarrierOrders?.(id, 1, 1000);
        if (o1?.orders || o1?.data?.orders || Array.isArray(o1?.data)) {
          const list = o1?.orders ?? o1?.data?.orders ?? o1?.data ?? [];
          const total = o1?.total ?? list.length;
          return { list, total };
        }
      } catch (e) {}
      try {
        const o2 = await (adminApi as any).getOrdersByCarrier?.({ carrierId: id, limit: 1000 });
        if (o2?.orders || o2?.data?.orders || Array.isArray(o2?.data)) {
          const list = o2?.orders ?? o2?.data?.orders ?? o2?.data ?? [];
          const total = o2?.total ?? list.length;
          return { list, total };
        }
      } catch (e) {}
      return { list: [], total: 0 };
    };

    try {
      if (!carrierId) {
        setError("Thiếu carrierId để tải dữ liệu.");
        setLoading(false);
        return;
      }

      const cRaw = await getCarrier(carrierId);
      if (!cRaw) {
        setError("Không lấy được thông tin carrier (endpoint không tồn tại hoặc trả rỗng).");
        setLoading(false);
        return;
      }

      const [vRaw, oRaw] = await Promise.all([
        getVehicle(carrierId),
        getOrders(carrierId),
      ]);

      const carrierCore = {
        id: cRaw?.id ?? cRaw?._id ?? cRaw?.userId ?? String(carrierId),
        fullName: cRaw?.full_name ?? cRaw?.fullName ?? cRaw?.name ?? "—",
        email: cRaw?.email ?? "—",
        phone: cRaw?.phone ?? "—",
        licenseNumber: cRaw?.licenseNumber ?? cRaw?.driverLicense ?? "",
        vehiclePlate: cRaw?.vehiclePlate ?? cRaw?.vehicle_plate ?? "",
        status: (cRaw?.status ?? "Active") as "Active" | "Inactive" | "Banned",
        rating: Number(cRaw?.rating ?? 0),
        joinDate: cRaw?.created_at ?? cRaw?.createdAt ?? new Date().toISOString(),
        lastActive: cRaw?.updated_at ?? cRaw?.updatedAt ?? new Date().toISOString(),
        avatar: cRaw?.avatar,
        banReason: cRaw?.banReason ?? "",
      };

      const vehicle = vRaw
        ? {
            plate: vRaw?.plate_number ?? vRaw?.plate ?? vRaw?.vehiclePlate ?? carrierCore.vehiclePlate ?? "Chưa cập nhật",
            type: vRaw?.type ?? vRaw?.vehicleType ?? "Chưa cập nhật",
            capacity: Number(vRaw?.capacity ?? 0),
            status: vRaw?.status ?? "Available",
          }
        : undefined;

      const normOrder = (o: any) => {
        const orderCode = o?.code ?? o?.orderCode ?? o?.order_code ?? "—";
        const id = o?._id ?? o?.id ?? orderCode;

        const pickup =
          o?.pickup_address ?? o?.pickupAddress ?? o?.pickUpAddress ?? "—";
        const delivery =
          o?.delivery_address ?? o?.deliveryAddress ?? o?.dropoffAddress ?? "—";

        const status = String(o?.status ?? "PENDING").toUpperCase();
        const when =
          o?.completedAt ?? o?.deliveredAt ?? o?.updatedAt ?? o?.scheduledAt ?? "";

        const customerName =
          o?.customer_id?.full_name ??
          o?.customer?.full_name ??
          o?.customerName ??
          o?.customer_name ??
          "—";
        const customerPhone =
          o?.customer_id?.phone ?? o?.customer?.phone ?? o?.customerPhone ?? "";

        let total =
          o?.totalPrice ??
          o?.total_price ??
          o?.total ??
          o?.amount ??
          o?.payment?.total ??
          o?.pricing?.total ??
          o?.summary?.grandTotal;

        if ((total === undefined || total === null) && Array.isArray(o?.items)) {
          const base = o.items.reduce((s: number, it: any) => {
            const unit = Number(it?.price ?? it?.unitPrice ?? it?.amount ?? 0);
            const qty = Number(it?.quantity ?? it?.qty ?? 1);
            return s + unit * qty;
          }, 0);
          const ship = Number(o?.shippingFee ?? o?.fees?.shipping ?? o?.deliveryFee ?? 0);
          const off = Number(o?.discount ?? o?.promotion?.discount ?? 0);
          total = base + ship - off;
        }

        return {
          id,
          orderCode,
          status,
          pickupAddress: pickup,
          deliveryAddress: delivery,
          estimatedDelivery: o?.scheduledTime ?? o?.scheduled_at ?? "Chưa có",
          customerName,
          customerPhone,
          completedAt: when,
          revenue: Number(total ?? 0),
          commission: Number(o?.commission ?? o?.commissionFee ?? Math.max(Number(total ?? 0) * 0.2, 0)),
        };
      };

      const orders = (oRaw.list ?? []).map(normOrder);
      const currentOrders = orders.filter((x) =>
        ["ASSIGNED", "ACCEPTED", "ON_THE_WAY", "ARRIVED", "DELIVERING"].includes(x.status)
      );
      const completedOrders = orders.filter((x) =>
        ["DELIVERED", "COMPLETED", "CANCELLED"].includes(x.status)
      );

      const totalEarnings = orders.reduce((s, x) => s + (x.revenue || 0), 0);
      const commissionPaid = orders.reduce((s, x) => s + (x.commission || 0), 0);
      const pendingCommission = currentOrders.reduce((s, x) => s + (x.commission || 0), 0);

      const realCarrier: CarrierDetail = {
        ...carrierCore,
        totalTrips: oRaw.total ?? orders.length,
        completedTrips: completedOrders.length,
        earnings: totalEarnings,
        commissionPaid,
        vehicle,
        recentOrders: orders,
        currentOrders,
        reviews: [],
        reports: [],
        financials: {
          totalEarnings,
          commissionPaid,
          pendingCommission,
          commissionRate: 20,
          lastPayout: new Date().toISOString(),
          nextPayout: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      setCarrier(realCarrier);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Lỗi khi tải chi tiết carrier";
      setError(msg);
      console.error("DriverDetail fetch error:", e);
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
      case "DELIVERING":
        return "bg-blue-100 text-blue-800";
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":
        return "bg-orange-100 text-orange-800";
      case "DELIVERED":
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "PENDING": "Chờ xử lý",
      "ASSIGNED": "Đã phân công",
      "ACCEPTED": "Đã nhận đơn",
      "ON_THE_WAY": "Đang giao",
      "DELIVERING": "Đang giao hàng",
      "ARRIVED": "Đã đến nơi",
      "DELIVERED": "Đã giao",
      "COMPLETED": "Hoàn thành",
      "CANCELLED": "Đã hủy",
      "INCIDENT": "Sự cố",
      "PAUSED": "Tạm dừng"
    };
    
    return statusMap[status] || status;
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
            <p className="text-gray-600">ID: {carrier.id || String(carrierId)}</p>
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
              { id: "vehicle", name: "Thông tin xe", icon: Truck },
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
                    <div className="text-2xl font-bold text-gray-900">{carrier.totalTrips}</div>
                    <div className="text-sm text-gray-600">Tổng đơn hàng</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{carrier.completedTrips}</div>
                    <div className="text-sm text-gray-600">Đơn hoàn thành</div>
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
                  <h4 className="font-semibold mb-3">Đơn hàng hiện tại ({carrier.currentOrders.length})</h4>
                  {carrier.currentOrders.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Không có đơn hàng hiện tại
                    </div>
                  ) : (
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
                            Dự kiến: {order.estimatedDelivery}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin xe */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Thông tin phương tiện</h3>
                {carrier.vehicle ? (
                  <div className="border rounded-lg p-6">
                    <div className="space-y-4">
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
                          carrier.vehicle.status === "Available" ? "text-green-600" : 
                          carrier.vehicle.status === "In Use" ? "text-blue-600" : "text-yellow-600"
                        }`}>
                          {carrier.vehicle.status === "Available" ? "Sẵn sàng" : 
                          carrier.vehicle.status === "In Use" ? "Đang sử dụng" : 
                          carrier.vehicle.status === "Maintenance" ? "Bảo trì" : carrier.vehicle.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <div>Chưa có thông tin phương tiện</div>
                    <button 
                      className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                      onClick={() => setActiveTab("vehicle")}
                    >
                      Thêm phương tiện
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Đơn hàng */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Tất cả đơn hàng */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Tất cả đơn hàng ({carrier.totalTrips})
                </h3>
                {carrier.recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <div>Không có đơn hàng nào</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Mã đơn</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Điểm lấy</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Điểm giao</th>
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
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                              {order.pickupAddress}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                              {order.deliveryAddress}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Thông tin xe */}
          {activeTab === "vehicle" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Thông tin phương tiện</h3>
                {!carrier.vehicle && (
                  <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Thêm phương tiện
                  </button>
                )}
              </div>
              
              {carrier.vehicle ? (
                <>
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
                            carrier.vehicle.status === "Available" ? "text-green-600" : 
                            carrier.vehicle.status === "In Use" ? "text-blue-600" : "text-yellow-600"
                          }`}>
                            {carrier.vehicle.status === "Available" ? "Sẵn sàng" : 
                            carrier.vehicle.status === "In Use" ? "Đang sử dụng" : 
                            carrier.vehicle.status === "Maintenance" ? "Bảo trì" : carrier.vehicle.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border rounded-lg p-6">
                      <h4 className="font-semibold mb-4">Thống kê sử dụng</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tổng đơn hàng đã vận chuyển:</span>
                          <span className="font-medium">{carrier.totalTrips}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Đơn hàng hoàn thành:</span>
                          <span className="font-medium text-green-600">{carrier.completedTrips}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tỷ lệ hoàn thành:</span>
                          <span className="font-medium text-blue-600">
                            {carrier.totalTrips > 0 ? ((carrier.completedTrips / carrier.totalTrips) * 100).toFixed(0) : 0}%
                          </span>
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
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <div className="text-lg font-medium mb-2">Chưa có thông tin phương tiện</div>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    Tài xế chưa được gán phương tiện. Thêm phương tiện để tài xế có thể nhận đơn hàng.
                  </p>
                  <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 mx-auto">
                    <Truck className="w-4 h-4" />
                    Thêm phương tiện mới
                  </button>
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
                      <span className="text-gray-600">Doanh thu trung bình/đơn:</span>
                      <span className="font-medium">
                        ₫{carrier.totalTrips > 0 ? (carrier.earnings / carrier.totalTrips).toLocaleString() : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hoa hồng trung bình/đơn:</span>
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
        </div>
      </div>
    </div>
  );
}