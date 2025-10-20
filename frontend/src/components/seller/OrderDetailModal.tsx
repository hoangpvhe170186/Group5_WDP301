import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/users/orders/${orderId}`);
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
          <p><strong>Tổng tiền:</strong> {order.total_amount?.toLocaleString()}₫</p>
          <p><strong>Ngày tạo:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Ngày cập nhật:</strong> {new Date(order.updatedAt).toLocaleString()}</p>
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
