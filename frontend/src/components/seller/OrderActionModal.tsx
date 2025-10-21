"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

interface OrderActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

const OrderActionModal: React.FC<OrderActionModalProps> = ({
  isOpen,
  onClose,
  orderId,
}) => {
  const [status, setStatus] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [sellers, setSellers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);

  // 🧠 Lấy danh sách user
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [sellerRes, driverRes, carrierRes] = await Promise.all([
          axios.get("http://localhost:4000/api/users/sellers"),
          axios.get("http://localhost:4000/api/users/drivers"),
          axios.get("http://localhost:4000/api/users/carriers"),
        ]);
        setSellers(sellerRes.data.data || []);
        setDrivers(driverRes.data.data || []);
        setCarriers(carrierRes.data.data || []);
      } catch (error) {
        console.error("❌ Lỗi khi tải danh sách:", error);
        setMessage("⚠️ Không thể tải danh sách người dùng!");
      }
    };
    fetchLists();
  }, []);

  // 🧠 Lấy chi tiết đơn
  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/api/users/orders/${orderId}`
        );
        const data = res.data;
        setSellerId(data.seller_id?._id || data.seller_id || "");
        setDriverId(data.driver_id?._id || data.driver_id || "");
        setCarrierId(data.carrier_id?._id || data.carrier_id || "");
        setStatus(data.status || "");
        if (data.scheduled_time) {
          const date = new Date(data.scheduled_time);
          const localISO = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16);
          setScheduledTime(localISO);
        } else setScheduledTime("");
      } catch (err) {
        console.error("❌ Lỗi khi tải đơn:", err);
      }
    };
    fetchOrder();
  }, [orderId]);

  // 🧠 Cập nhật đơn
  const handleSave = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:4000/api/users/orders/${orderId}`,
        {
          seller_id: sellerId,
          driver_id: driverId,
          carrier_id: carrierId,
          status,
          scheduled_time: scheduledTime,
        }
      );
      if (res.data.success !== false) {
        setMessage("✅ Cập nhật thành công!");
        setTimeout(() => onClose(), 1000);
      } else {
        setMessage("❌ Cập nhật thất bại!");
      }
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật:", error);
      setMessage("🚨 Không thể cập nhật đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-[460px] relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Cập nhật / Giao việc đơn #{orderId}
        </h2>

        <div className="space-y-4">
          {/* Scheduled Time */}
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

          {/* Driver */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver
            </label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">-- Chọn driver --</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {message && (
          <p className="text-center text-sm text-gray-600 mt-3">{message}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
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

export default OrderActionModal;
