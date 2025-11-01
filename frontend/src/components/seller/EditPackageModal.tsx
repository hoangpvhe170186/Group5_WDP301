"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { X, RefreshCw, CheckCircle } from "lucide-react";

const EditPackageModal = ({ orderId, onClose, onUpdated }) => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [loading, setLoading] = useState(false);
  const [priceInfo, setPriceInfo] = useState(null);

  // ✅ Lấy danh sách gói dịch vụ
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/price-packages");
        setPackages(res.data?.data || res.data || []);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách gói:", err);
      }
    };
    fetchPackages();
  }, []);

  // ✅ Khi người dùng chọn gói mới, tự động xem thử giá mới
  const handlePreviewPrice = async () => {
    if (!selectedPackage) {
      alert("Vui lòng chọn gói cần đổi!");
      return;
    }

    setLoading(true);
    try {
      // 🔹 Lấy token và gửi kèm khi gọi API
      const token = localStorage.getItem("auth_token");
      const orderRes = await axios.get(`http://localhost:4000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const order = orderRes.data?.order || orderRes.data; // ✅ fix
      if (!order.pickup_address || !order.delivery_address) {
        alert("Không tìm thấy địa chỉ của đơn hàng.");
        return;
      }

      // 🔹 Gọi API tính giá mới
      const res = await axios.post("http://localhost:4000/api/pricing/estimate2", {
        pricepackage_id: selectedPackage,
        pickup_address: order.pickup_address,
        delivery_address: order.delivery_address,
      });

      console.log("📦 API Response:", res.data);

      if (res.data?.success) {
        setPriceInfo(res.data.data);
      } else {
        alert(res.data?.message || "Không tính được giá mới!");
      }
    } catch (err) {
      console.error("❌ Lỗi khi xem giá mới:", err.response?.data || err.message);
      alert("Không thể xem trước giá mới.");
    } finally {
      setLoading(false);
    }
  };
  // ✅ Xác nhận đổi gói
  const handleConfirmUpdate = async () => {
  if (!selectedPackage) {
    alert("Vui lòng chọn gói muốn đổi!");
    return;
  }
  setLoading(true);
  try {
    const token = localStorage.getItem("auth_token");
    const res = await axios.patch(
      `http://localhost:4000/api/orders/${orderId}/update-package`, 
      { new_package_id: selectedPackage },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.data?.success) {
      alert("✅ Đã đổi gói thành công!");
      onUpdated();
    } else {
      alert(res.data?.message || "Không thể cập nhật gói.");
    }
  } catch (err) {
    console.error("❌ Lỗi khi đổi gói:", err.response?.data || err.message);
    alert("⚠ " + (err.response?.data?.message || err.message));
  } finally {
    setLoading(false);
  }
};

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">🔧 Đổi gói dịch vụ</h2>
          <button
            onClick={onClose}
            className="bg-white text-orange-600 hover:bg-orange-100 font-semibold px-3 py-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Chọn gói dịch vụ mới
            </label>
            <select
              className="w-full border rounded-lg p-2 text-gray-700"
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
            >
              <option value="">-- Chọn gói --</option>
              {packages.map((pkg) => (
                <option key={pkg._id} value={pkg._id}>
                  {pkg.name} ({pkg.capacity}kg)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handlePreviewPrice}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              {loading ? "Đang tính..." : "Xem giá mới"}
            </button>
          </div>

          {/* ✅ Thông tin giá mới */}
          {priceInfo && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-gray-700">
                <strong>Giá mới dự kiến:</strong>{" "}
                <span className="text-green-600 font-semibold">
                  {priceInfo.totalFee?.toLocaleString()}₫
                </span>
              </p>
              <p className="text-gray-700">
                <strong>Khoảng cách:</strong>{" "}
                <span className="text-blue-600">{priceInfo.distance?.text}</span>
              </p>
              <p className="text-gray-700">
                <strong>Thời gian ước tính:</strong>{" "}
                <span className="text-blue-600">{priceInfo.duration?.text}</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirmUpdate}
            disabled={loading || !selectedPackage}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {loading ? "Đang cập nhật..." : "Xác nhận đổi gói"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPackageModal;
