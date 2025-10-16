import React, { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";

interface AssignModalProps {
  orderId: string | number;
  onClose: () => void;
}

const AssignModal: React.FC<AssignModalProps> = ({ orderId, onClose }) => {
  const [drivers, setDrivers] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [message, setMessage] = useState("");

  // ✅ Gọi API lấy danh sách driver và carrier
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [driverRes, carrierRes] = await Promise.all([
          axios.get("http://localhost:4000/api/users/drivers"),
          axios.get("http://localhost:4000/api/users/carriers"),
        ]);

        setDrivers(driverRes.data.data);
        setCarriers(carrierRes.data.data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách:", error);
        setMessage("⚠️ Không thể tải danh sách tài xế hoặc nhà vận chuyển!");
      }
    };
    fetchLists();
  }, []);

  const handleAssign = async () => {
  if (!selectedDriver || !selectedCarrier) {
    setMessage("⚠️ Vui lòng chọn đầy đủ Driver và Carrier!");
    return;
  }

  try {
    const res = await axios.post(`http://localhost:4000/api/users/orders/${orderId}/assign`, {
      driver_id: selectedDriver,
      carrier_id: selectedCarrier,
    });

    if (res.data.success) {
      setMessage("✅ Giao việc thành công!");
      console.log("🟢 Dữ liệu trả về:", res.data.data);
      setTimeout(() => onClose(), 1000);
    } else {
      setMessage("❌ Có lỗi khi giao việc!");
    }
  } catch (error) {
    console.error("❌ Lỗi khi gửi yêu cầu giao việc:", error);
    setMessage("🚨 Lỗi kết nối server!");
  }
};

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Giao việc cho đơn #{orderId}
        </h2>

        {/* Chọn driver */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Driver</label>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">-- Chọn driver --</option>
            {drivers.map((d: any) => (
              <option key={d._id} value={d._id}>
                {d.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Chọn carrier */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Carrier</label>
          <select
            value={selectedCarrier}
            onChange={(e) => setSelectedCarrier(e.target.value)}
            className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">-- Chọn carrier --</option>
            {carriers.map((c: any) => (
              <option key={c._id} value={c._id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </div>

        {message && <p className="mt-2 text-sm text-center text-gray-600">{message}</p>}

        <div className="mt-5 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            Hủy
          </button>
          <button
            onClick={handleAssign}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Giao việc
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignModal;
