import React, { useEffect, useState } from "react";
import { 
  X, Package, Truck, Users, Building, Clock, Weight, MapPin, Phone, Mail, User,
  FileText, History, DollarSign, Car, Calendar, AlertCircle
} from "lucide-react";
import { adminApi } from "@/services/admin.service";

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("🔍 Đang tải chi tiết đơn hàng:", orderId);
        const orderData = await adminApi.getOrderDetail(orderId);
        console.log("✅ Dữ liệu đơn hàng nhận được:", orderData);
        setOrder(orderData);
      } catch (err: any) {
        console.error("❌ Lỗi khi tải chi tiết đơn hàng:", err);
        console.error("❌ Chi tiết lỗi:", err.response?.data || err.message);
        setError(err.response?.data?.message || err.message || "Không thể tải chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getStatusColor = (status: string) => {
    const s = (status || "").toString().toUpperCase();
    const colors: { [key: string]: string } = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      AVAILABLE: "bg-cyan-100 text-cyan-800",
      ASSIGNED: "bg-purple-100 text-purple-800",
      ACCEPTED: "bg-green-100 text-green-800",
      ON_THE_WAY: "bg-indigo-100 text-indigo-800",
      ARRIVED: "bg-cyan-100 text-cyan-800",
      DELIVERED: "bg-emerald-100 text-emerald-800",
      COMPLETED: "bg-green-100 text-green-800",
      DECLINED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-300 text-gray-700",
      INCIDENT: "bg-orange-100 text-orange-800",
      PAUSED: "bg-slate-200 text-slate-800",
      NOTE: "bg-gray-100 text-gray-800",
    };
    return colors[s] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const s = (status || "").toString().toUpperCase();
    const statusMap: { [key: string]: string } = {
      PENDING: "Chờ xử lý",
      CONFIRMED: "Đã xác nhận",
      AVAILABLE: "Có sẵn",
      ASSIGNED: "Đã phân công",
      ACCEPTED: "Đã chấp nhận",
      ON_THE_WAY: "Đang vận chuyển",
      ARRIVED: "Đã đến nơi",
      DELIVERED: "Đã giao",
      COMPLETED: "Hoàn thành",
      DECLINED: "Từ chối",
      CANCELLED: "Đã hủy",
      INCIDENT: "Sự cố",
      PAUSED: "Tạm dừng",
      NOTE: "Ghi chú",
    };
    return statusMap[s] || status;
  };

  const safeString = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object" && value.$numberDecimal) {
      return String(value.$numberDecimal);
    }
    return String(value);
  };

  const safeNumber = (value: any): number => {
    try {
      if (typeof value === "number") return value;
      if (typeof value === "object" && value.$numberDecimal) {
        return parseFloat(String(value.$numberDecimal));
      }
      return parseFloat(String(value || "0"));
    } catch {
      return 0;
    }
  };

  const safeDate = (value: any): string => {
    try {
      if (!value) return "—";
      return new Date(value).toLocaleString("vi-VN");
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50" onClick={onClose}>
        <div className="bg-white p-6 rounded-xl shadow-md text-gray-700" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
            <span>Đang tải chi tiết đơn hàng...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50" onClick={onClose}>
        <div className="bg-white p-6 rounded-xl shadow-md text-gray-700 max-w-md" onClick={(e) => e.stopPropagation()}>
          <p className="text-red-600 mb-4 font-semibold">❌ Lỗi: {error}</p>
          <p className="text-sm text-gray-500 mb-4">Vui lòng kiểm tra console để biết thêm chi tiết.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50" onClick={onClose}>
        <div className="bg-white p-6 rounded-xl shadow-md text-gray-700 max-w-md" onClick={(e) => e.stopPropagation()}>
          <p className="text-red-600 mb-4">Không tìm thấy đơn hàng.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "info", label: "📋 Thông tin chung", count: null },
    { id: "items", label: "📦 Hàng hóa", count: order.items?.length || 0 },
    { id: "tracking", label: "📍 Tracking", count: order.trackings?.length || 0 },
    { id: "statusLogs", label: "📝 Lịch sử trạng thái", count: order.statusLogs?.length || 0 },
    { id: "extraFees", label: "💰 Phụ phí", count: order.extra_fees?.length || 0 },
    { id: "audit", label: "📊 nhật ký kiểm tra", count: order.auditLogs?.length || 0 },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
       <div 
        className="bg-white w-full max-w-6xl rounded-2xl shadow-xl max-h-[90vh] flex flex-col"
        style={{ overflow: 'visible' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold">
              Đơn hàng #{order.orderCode || order.code || "N/A"}
            </h2>
            <p className="text-orange-100 mt-1">
              {safeDate(order.scheduled_time || order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white text-orange-600 hover:bg-orange-100 font-semibold p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div 
          className="border-b bg-gradient-to-r from-gray-50 to-white overflow-x-auto shadow-sm sticky top-0 z-[100] flex-shrink-0"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            position: 'sticky',
            top: 0,
            visibility: 'visible !important',
            display: 'block !important',
            opacity: '1 !important',
            height: 'auto',
            minHeight: '60px',
            backgroundColor: 'rgb(249 250 251)',
          }}
        >
          <style>{`
            div[class*="overflow-x-auto"]::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex space-x-1 px-4 min-w-max" style={{ minHeight: '60px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-4 font-semibold text-sm rounded-t-xl transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-orange-600 shadow-lg border-t-2 border-l-2 border-r-2 border-orange-500 -mb-px"
                    : "text-gray-600 hover:text-orange-600 hover:bg-gray-50 border-t-2 border-l-2 border-r-2 border-transparent"
                }`}
                style={{ 
                  position: 'relative',
                  zIndex: activeTab === tab.id ? 101 : 100,
                  visibility: 'visible',
                  display: 'inline-flex',
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{tab.label.split(' ')[0]}</span>
                  <span className="font-medium">{tab.label.split(' ').slice(1).join(' ')}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`ml-1.5 px-2.5 py-1 rounded-full text-xs font-bold min-w-[24px] text-center ${
                      activeTab === tab.id 
                        ? "bg-orange-100 text-orange-700 shadow-sm" 
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-t-full" style={{ zIndex: 102 }}></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 relative z-10 min-h-0" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* Trạng thái & Thanh toán & Số điện thoại */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Trạng thái</h3>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Thanh toán</h3>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    order.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {order.isPaid ? "✅ Đã thanh toán" : "❌ Chưa thanh toán"}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Số điện thoại</h3>
                  <p className="text-gray-900">{order.phone || "—"}</p>
                </div>
              </div>

              {/* Thông tin gói dịch vụ */}
              {order.package_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <h3 className="font-semibold text-blue-800 text-lg mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {order.package_id.name ? `Gói dịch vụ: ${order.package_id.name}` : "Gói dịch vụ"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {order.package_id.vehicle && (
                      <div className="flex items-center gap-3">
                        <Truck className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Phương tiện</p>
                          <p className="text-blue-800 font-semibold">
                            {(() => {
                              const vehicle = order.package_id.vehicle;
                              if (typeof vehicle === 'string') {
                                return vehicle;
                              }
                              if (typeof vehicle === 'object' && vehicle !== null) {
                                return vehicle.name || vehicle.type || vehicle.vehicle_type || vehicle.label || "—";
                              }
                              return String(vehicle || "—");
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.package_id.workers && (
                      <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">Nhân viên</p>
                          <p className="text-green-800 font-semibold">{safeString(order.package_id.workers)}</p>
                        </div>
                      </div>
                    )}
                    {order.package_id.max_floor && (
                      <div className="flex items-center gap-3">
                        <Building className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Tầng</p>
                          <p className="text-purple-800 font-semibold">{safeString(order.package_id.max_floor)}</p>
                        </div>
                      </div>
                    )}
                    {order.package_id.capacity && (
                      <div className="flex items-center gap-3">
                        <Weight className="w-8 h-8 text-orange-600" />
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Tải trọng</p>
                          <p className="text-orange-800 font-semibold">{safeString(order.package_id.capacity)}kg</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {order.package_id.wait_time && (
                    <div className="mt-4 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Thời gian chờ: {safeString(order.package_id.wait_time)} giờ</p>
                      </div>
                    </div>
                  )}
                  {order.package_id.base_price && (
                    <div className="mt-4 flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Giá cơ bản: {safeNumber(order.package_id.base_price).toLocaleString()}₫</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Thông tin địa chỉ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Điểm lấy hàng
                  </h3>
                  <p className="text-green-700">{order.pickup_address || order.pickupAddress || "—"}</p>
                </div>
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Điểm giao hàng
                  </h3>
                  <p className="text-red-700">{order.delivery_address || order.deliveryAddress || "—"}</p>
                </div>
              </div>

              {/* Thông tin tài chính */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Thông tin tài chính</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tổng chi phí</p>
                    <p className="text-2xl font-bold text-green-600">
                      {safeNumber(order.total_price || order.price).toLocaleString()}₫
                    </p>
                  </div>
                  
                  {order.extra_fees && order.extra_fees.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Tổng phụ phí</p>
                      <p className="text-lg font-semibold text-orange-600">
                        {order.extra_fees.reduce((sum: number, fee: any) => {
                          const amount = fee.amount || fee.price || 0;
                          return sum + safeNumber(amount);
                        }, 0).toLocaleString()}₫
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin người dùng */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Khách hàng
                  </h4>
                  <p className="text-gray-900 font-medium">
                    {order.customer_id?.full_name || order.customer?.full_name || "—"}
                  </p>
                  {order.customer_id?.email && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {order.customer_id.email}
                    </p>
                  )}
                  {(order.customer_id?.phone || order.phone) && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {order.customer_id?.phone || order.phone}
                    </p>
                  )}
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Seller
                  </h4>
                  <p className="text-gray-900 font-medium">
                    {order.seller_id?.full_name || order.seller?.full_name || "—"}
                  </p>
                  {order.seller_id?.phone && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {order.seller_id.phone}
                    </p>
                  )}
                  {order.seller_id?.email && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {order.seller_id.email}
                    </p>
                  )}
                </div>
                {(order.carrier_id || order.assignedCarrier) && (
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Carrier
                    </h4>
                    <p className="text-gray-900 font-medium">
                      {order.carrier_id?.full_name || order.assignedCarrier?.full_name || "—"}
                    </p>
                    {order.carrier_id?.phone && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {order.carrier_id.phone}
                      </p>
                    )}
                    
                    {order.acceptedBy?.full_name && (
                      <p className="text-sm text-gray-500 mt-1">
                        Chấp nhận bởi: {order.acceptedBy.full_name}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Thông tin phương tiện */}
              {order.vehicle_id && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Phương tiện
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {order.vehicle_id.license_plate && (
                      <div>
                        <p className="text-sm text-gray-600">Biển số</p>
                        <p className="text-gray-900 font-medium">{safeString(order.vehicle_id.license_plate)}</p>
                      </div>
                    )}
                    {order.vehicle_id.vehicle_type && (
                      <div>
                        <p className="text-sm text-gray-600">Loại xe</p>
                        <p className="text-gray-900 font-medium">{safeString(order.vehicle_id.vehicle_type)}</p>
                      </div>
                    )}
                    {order.vehicle_id.capacity && (
                      <div>
                        <p className="text-sm text-gray-600">Tải trọng</p>
                        <p className="text-gray-900 font-medium">{safeString(order.vehicle_id.capacity)}kg</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thông tin bổ sung */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.scheduled_time && (
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Thời gian hẹn
                    </h4>
                    <p className="text-gray-900">{safeDate(order.scheduled_time)}</p>
                  </div>
                )}
                {order.availableAt && (
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Có sẵn từ
                    </h4>
                    <p className="text-gray-900">{safeDate(order.availableAt)}</p>
                  </div>
                )}
                {order.declineReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Lý do từ chối
                    </h4>
                    <p className="text-red-900">{order.declineReason}</p>
                  </div>
                )}
                {order.signatureUrl && (
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Chữ ký
                    </h4>
                    <img 
                      src={order.signatureUrl} 
                      alt="Chữ ký" 
                      className="max-w-full h-32 object-contain border rounded"
                    />
                  </div>
                )}
              </div>

              {/* Thông tin thời gian */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3">Thông tin thời gian</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ngày tạo</p>
                    <p className="text-gray-900">{safeDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ngày cập nhật</p>
                    <p className="text-gray-900">{safeDate(order.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              {(order.note || order.description) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Ghi chú</h4>
                  <p className="text-yellow-700">{order.note || order.description}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "items" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Danh sách hàng hóa</h3>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-4">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-800 text-lg">#{idx + 1} - {item.description || "Không có mô tả"}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.fragile ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}>
                          {item.fragile ? "🪞 Dễ vỡ" : "✅ Bình thường"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-600">Số lượng:</span>
                          <p className="text-gray-800">{item.quantity || 0} cái</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600">Trọng lượng:</span>
                          <p className="text-gray-800">
                            {(() => {
                              try {
                                if (!item.weight) return "0";
                                if (typeof item.weight === "object" && item.weight.$numberDecimal) {
                                  return parseFloat(String(item.weight.$numberDecimal)).toFixed(2);
                                }
                                return parseFloat(String(item.weight)).toFixed(2);
                              } catch {
                                return "0";
                              }
                            })()} kg
                          </p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600">Loại hàng:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.type && item.type.length > 0 ? (
                              item.type.map((type: string, i: number) => (
                                <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  {type}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-xs">Không phân loại</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {item.shipping_instructions && item.shipping_instructions.length > 0 && (
                        <div className="mt-3">
                          <span className="font-semibold text-gray-600 text-sm">Hướng dẫn vận chuyển:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.shipping_instructions.map((instruction: string, i: number) => (
                              <span key={i} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                                {instruction}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.driver_note && (
                        <div className="mt-3">
                          <span className="font-semibold text-gray-600 text-sm">Ghi chú cho tài xế:</span>
                          <p className="text-gray-700 bg-yellow-50 p-2 rounded border text-sm mt-1">
                            {item.driver_note}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p>Chưa có thông tin hàng hóa</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "tracking" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Lịch sử tracking</h3>
              {order.trackings && order.trackings.length > 0 ? (
                <div className="space-y-4">
                  {order.trackings.map((tracking: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {getStatusText(tracking.status)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {tracking.carrier_id?.full_name || "Hệ thống"}
                          </p>
                          {tracking.note && (
                            <p className="text-sm text-gray-700 mt-2">{tracking.note}</p>
                          )}
                          {tracking.meta && Object.keys(tracking.meta).length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(tracking.meta, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {safeDate(tracking.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Truck className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p>Chưa có thông tin tracking</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "statusLogs" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Lịch sử thay đổi trạng thái</h3>
              {order.statusLogs && order.statusLogs.length > 0 ? (
                <div className="space-y-4">
                  {order.statusLogs.map((log: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(log.status)}`}>
                            {getStatusText(log.status)}
                          </span>
                          <p className="text-sm text-gray-600 mt-2">
                            {log.updated_by?.full_name || "Hệ thống"}
                          </p>
                          {log.note && (
                            <p className="text-sm text-gray-700 mt-2">{log.note}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {safeDate(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p>Chưa có lịch sử thay đổi trạng thái</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "extraFees" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Danh sách phụ phí</h3>
              {order.extra_fees && order.extra_fees.length > 0 ? (
                <div className="space-y-4">
                  {order.extra_fees.map((fee: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{fee.name || "Phụ phí"}</h4>
                          {fee.category && (
                            <p className="text-sm text-gray-600 mt-1">{fee.category}</p>
                          )}
                          {fee.description && (
                            <p className="text-sm text-gray-700 mt-2">{fee.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">
                            {safeNumber(fee.price || fee.amount).toLocaleString()}₫
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold text-gray-800">Tổng phụ phí:</p>
                      <p className="text-xl font-bold text-orange-600">
                        {order.extra_fees.reduce((sum: number, fee: any) => {
                          const amount = fee.amount || fee.price || 0;
                          return sum + safeNumber(amount);
                        }, 0).toLocaleString()}₫
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p>Không có phụ phí</p>
                </div>
              )}
            </div>
          )}

          
{activeTab === "audit" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Audit Logs</h3>
              {order.auditLogs && order.auditLogs.length > 0 ? (
                <div className="space-y-4">
                  {order.auditLogs.map((log: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{log.action || "Hành động"}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Bởi: {log.by?.full_name || log.by_user?.full_name || log.updated_by?.full_name || (typeof log.by === 'string' ? log.by : "Hệ thống")}
                          </p>
                          {log.note && (
                            <p className="text-sm text-gray-700 mt-2">{log.note}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {safeDate(log.at || log.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p>Chưa có nhật ký kiểm tra</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
