"use client";

import { useState, useEffect } from "react";
import React from "react";
import axios from "axios";

interface UpdateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

const UpdateOrderModal: React.FC<UpdateOrderModalProps> = ({
  isOpen,
  onClose,
  orderId,
}) => {
  const [sellerId, setSellerId] = useState("");
  const [status, setStatus] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState<any[]>([]); // danh sách seller

  // 🧠 Lấy danh sách seller
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/users/sellers");
        setSellers(res.data.data || []);
      } catch (err) {
        console.error("Error fetching sellers:", err);
      }
    };
    fetchSellers();
  }, []);

  // 🧠 Lấy chi tiết đơn hàng
  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/users/orders/${orderId}`);
        const data = res.data;
        setSellerId(data.seller_id?._id || data.seller_id || "");
        setStatus(data.status || "");
        if (data.scheduled_time) {
  const date = new Date(data.scheduled_time);
  const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16); // => "2025-10-18T13:29"
  setScheduledTime(localISO);
} else {
  setScheduledTime("");
}
      } catch (err) {
        console.error("Error fetching order:", err);
      }
    };
    fetchOrder();
  }, [orderId]);

  // 🧠 Cập nhật đơn hàng
  const handleSubmit = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      await axios.put(`http://localhost:4000/api/users/orders/${orderId}`, {
        seller_id: sellerId,
        status,
        scheduled_time: scheduledTime,
      });
      alert("✅ Cập nhật đơn hàng thành công!");
      onClose();
    } catch (err) {
      console.error("Error updating order:", err);
      alert("❌ Lỗi khi cập nhật đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-[420px]">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Cập nhật đơn hàng</h2>

        <div className="space-y-4">
          {/* Seller */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seller
            </label>
            <select
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">-- Chọn seller --</option>
              {sellers.map((seller) => (
                <option key={seller._id} value={seller._id}>
                  {seller.full_name || seller.email}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">-- Chọn trạng thái --</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Scheduled time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời gian dự kiến
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateOrderModal;
