import React, { useEffect, useState } from "react";
import { X, Package, Image, Truck, Users, Building, Clock, Weight } from "lucide-react";
import axios from "axios";

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "items" | "images"

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return alert("Bạn cần đăng nhập!");

        const res = await axios.get(`http://localhost:4000/api/users/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrder(res.data?.data || res.data);
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div className="bg-white p-6 rounded-xl shadow-md text-gray-700">Đang tải...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div className="bg-white p-6 rounded-xl shadow-md text-gray-700">
          Không tìm thấy đơn hàng.
          <button
            onClick={onClose}
            className="mt-3 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  // Hàm định dạng trạng thái
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
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
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              Đơn hàng #{order.orderCode}
            </h2>
            <p className="text-blue-100 mt-1">
              {order.scheduled_time 
                ? new Date(order.scheduled_time).toLocaleString("vi-VN")
                : "Không có lịch hẹn"
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white text-blue-600 hover:bg-blue-100 font-semibold p-2 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b bg-white">
          <div className="flex space-x-1 px-6">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "info"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📋 Thông tin chung
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "items"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📦 Hàng hóa ({order.items?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("images")}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "images"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              🖼️ Ảnh ({order.images?.length || 0})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* Trạng thái & Thanh toán */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Trạng thái</h3>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
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
              </div>

              {/* Thông tin gói dịch vụ */}
              {order.package_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <h3 className="font-semibold text-blue-800 text-lg mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Gói dịch vụ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <Truck className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Phương tiện</p>
                        <p className="text-blue-800 font-semibold">{order.package_id.vehicle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-green-600 font-medium">Nhân viên</p>
                        <p className="text-green-800 font-semibold">{order.package_id.workers}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Tầng tối đa</p>
                        <p className="text-purple-800 font-semibold">{order.package_id.max_floor || 1}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Weight className="w-8 h-8 text-orange-600" />
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Tải trọng</p>
                        <p className="text-orange-800 font-semibold">{order.package_id.capacity}kg</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Thời gian chờ: {order.package_id.wait_time || 2} giờ</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Thông tin địa chỉ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    📍 Điểm lấy hàng
                  </h3>
                  <p className="text-green-700">{order.pickup_address}</p>
                </div>
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    🏁 Điểm giao hàng
                  </h3>
                  <p className="text-red-700">{order.delivery_address}</p>
                </div>
              </div>

              {/* Thông tin tài chính */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Thông tin tài chính</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tổng chi phí</p>
                    <p className="text-2xl font-bold text-green-600">
                      {order.total_price?.toLocaleString()}₫
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Giá cơ bản</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {order.package_id?.base_price 
                        ? parseFloat(order.package_id.base_price.$numberDecimal || order.package_id.base_price).toLocaleString()
                        : "0"
                      }₫
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phụ phí</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {order.extra_fees && order.extra_fees.length > 0 
                        ? order.extra_fees.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0).toLocaleString()
                        : "0"
                      }₫
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin người dùng */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Khách hàng</h4>
                  <p className="text-gray-900">{order.customer_id?.full_name || "—"}</p>
                  <p className="text-sm text-gray-500">{order.phone}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Tài xế</h4>
                  <p className="text-gray-900">{order.driver_id?.full_name || "Chưa phân công"}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Người tạo đơn</h4>
                  <p className="text-gray-900">{order.seller_id?.full_name || "—"}</p>
                </div>
              </div>
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
                        <h4 className="font-semibold text-gray-800 text-lg">#{idx + 1} - {item.description}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.fragile ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}>
                          {item.fragile ? "🪞 Dễ vỡ" : "✅ Bình thường"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-600">Số lượng:</span>
                          <p className="text-gray-800">{item.quantity} cái</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600">Trọng lượng:</span>
                          <p className="text-gray-800">
                            {item.weight
                              ? parseFloat(item.weight.$numberDecimal || item.weight).toFixed(2)
                              : "0"} kg
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

          {activeTab === "images" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hình ảnh đơn hàng</h3>
              {order.images && order.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.images.map((image: any, idx: number) => (
                    <div key={idx} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                      <img
                        src={image.url}
                        alt={`Ảnh đơn hàng ${idx + 1}`}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(image.url, '_blank')}
                      />
                      <div className="p-3">
                        <p className="text-sm text-gray-600 truncate">
                          {new Date(image.uploadedAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Image className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p>Chưa có hình ảnh nào được upload</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;