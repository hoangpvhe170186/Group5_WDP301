"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";

const ReportIncidentModal = ({ orderId, customerId, onClose }) => {
  const [type, setType] = useState("Damage");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [previousReports, setPreviousReports] = useState([]);

  // 📦 Lấy danh sách các báo cáo trước đây
  useEffect(() => {
  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Chưa đăng nhập");

      const res = await axios.get(
        `http://localhost:4000/api/users/incidents/order/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPreviousReports(res.data);
    } catch (err) {
      console.error("❌ Lỗi khi tải báo cáo:", err);
    }
  };
  if (orderId) fetchReports();
}, [orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let evidenceUrl = "";
      const token = localStorage.getItem("auth_token");
      if (!token) return alert("Bạn cần đăng nhập!");
      if (file) {
        const formDataUpload = new FormData();
        formDataUpload.append("files", file);
        formDataUpload.append("folder", "orders/incidents");
        const uploadRes = await axios.post(
          "http://localhost:4000/api/upload/images",
          formDataUpload,
          {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`, // ✅ gửi token
      },
      withCredentials: true, // nếu backend dùng cookie
    }
        );
        evidenceUrl = uploadRes.data[0].url;
      }

      const reportData = {
        order_id: orderId,
        reported_by: customerId,
        type,
        description,
        evidence_file: evidenceUrl,
      };

if (!token) return alert("Chưa đăng nhập");

try {
  // Gửi báo cáo
  await axios.post(
    "http://localhost:4000/api/users/incidents/report",
    reportData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  alert("✅ Báo cáo đã được gửi!");
  onClose();
  setDescription("");
  setFile(null);

  // Refresh list báo cáo
  const res = await axios.get(
    `http://localhost:4000/api/users/incidents/order/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  setPreviousReports(res.data);
} catch (err) {
  console.error("❌ Lỗi khi gửi báo cáo:", err);
  alert("Không thể gửi báo cáo.");
}

    } catch (err) {
      console.error(err);
      alert("❌ Gửi thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">🚩 Báo cáo sự cố đơn hàng</h2>

        {/* 🔹 Danh sách báo cáo cũ */}
        {previousReports.length > 0 && (
          <div className="mb-4 border rounded-lg p-2 max-h-40 overflow-y-auto text-sm bg-gray-50">
            <p className="font-medium text-gray-700 mb-1">📜 Các báo cáo trước:</p>
            {previousReports.map((r) => (
              <div key={r._id} className="border-b last:border-none py-1">
                <p>
                  <strong>Loại:</strong> {r.type} — <strong>Trạng thái:</strong>{" "}
                  <span
                    className={
                      r.status === "Resolved"
                        ? "text-green-600"
                        : r.status === "Rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }
                  >
                    {r.status}
                  </span>
                </p>
                <p className="text-gray-600 text-xs line-clamp-2">
                  {r.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 🔹 Form báo cáo mới */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Loại sự cố</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1 text-sm"
            >
              <option value="Damage">Hư hỏng hàng hóa</option>
              <option value="Delay">Giao hàng trễ</option>
              <option value="Missing Item">Thiếu hàng</option>
              <option value="Vehicle Issue">Sự cố phương tiện</option>
              <option value="Other">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Mô tả chi tiết</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border rounded-lg p-2 mt-1 text-sm"
              placeholder="Nhập mô tả sự cố..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Ảnh minh chứng (tùy chọn)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncidentModal;
