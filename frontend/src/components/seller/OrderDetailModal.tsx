import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const [orderRes, itemRes] = await Promise.all([
          axios.get(`http://localhost:4000/api/users/orders/${orderId}`),
          axios.get(`http://localhost:4000/api/users/order-items/${orderId}`)
        ]);

        setOrder(orderRes.data?.data || orderRes.data);
        setOrderItems(itemRes.data || []);
      } catch (err) {
        console.error("❌ Lỗi khi tải chi tiết đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 relative">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Chi tiết đơn hàng #{order._id}
        </h2>

        <div className="space-y-3 text-sm text-gray-700">
          <p><strong>Trạng thái:</strong> {order.status}</p>
          <p><strong>Người bán:</strong> {order.seller_id?.full_name || "—"}</p>
          <p><strong>Khách hàng:</strong> {order.customer_id?.full_name || "—"}</p>
          <p><strong>Driver:</strong> {order.driver_id?.full_name || "—"}</p>
          <p><strong>Carrier:</strong> {order.carrier_id?.full_name || "—"}</p>
          <p><strong>Địa chỉ lấy hàng:</strong> {order.pickup_address}</p>
          <p><strong>Địa chỉ giao hàng:</strong> {order.delivery_address}</p>
          <p><strong>Tổng tiền:</strong> {order.total_price?.toLocaleString()}₫</p>
          <p><strong>Ngày tạo:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Ngày cập nhật:</strong> {new Date(order.updatedAt).toLocaleString()}</p>
        </div>

        {/* 🧾 Danh sách hàng trong đơn */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Danh sách hàng hóa</h3>
          {orderItems.length === 0 ? (
            <p className="text-gray-500 text-sm">Không có mặt hàng nào trong đơn này.</p>
          ) : (
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">Mô tả</th>
                  <th className="p-2 border">Số lượng</th>
                  <th className="p-2 border">Cân nặng (kg)</th>
                  <th className="p-2 border">Hàng dễ vỡ</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 border">{item.description || "—"}</td>
                    <td className="p-2 border text-center">{item.quantity}</td>
                    <td className="p-2 border text-center">
                      {parseFloat(item.weight)?.toFixed(2)}
                    </td>
                    <td className="p-2 border text-center">
                      {item.fragile ? "✅ Có" : "❌ Không"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
