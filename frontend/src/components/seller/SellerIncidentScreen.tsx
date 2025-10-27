"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, AlertTriangle } from "lucide-react";

const StaffIncidentScreen = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧠 Lấy danh sách khiếu nại
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/users/incidents");
        setIncidents(res.data);
      } catch (err) {
        console.error("❌ Lỗi khi tải khiếu nại:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  // 🧩 Xử lý giải quyết khiếu nại
  const handleResolve = async (id) => {
    if (!window.confirm("Xác nhận đánh dấu đã giải quyết khiếu nại này?")) return;
    try {
      await axios.patch(`http://localhost:4000/api/users/incidents/${id}/resolve`);
      alert("✅ Đã đánh dấu là đã giải quyết!");
      setIncidents((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "Resolved" } : r))
      );
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi cập nhật!");
    }
  };

  if (loading) return <p className="text-center py-10">Đang tải...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <AlertTriangle className="text-yellow-500" /> Danh sách khiếu nại khách hàng
      </h2>

      {incidents.length === 0 ? (
        <p className="text-gray-600">Không có khiếu nại nào.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Loại sự cố</th>
                <th className="p-3">Mô tả</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr key={i._id} className="border-t">
                  <td className="p-3">{i.order_id?.code || i.order_id}</td>
                  <td className="p-3">{i.type}</td>
                  <td className="p-3 line-clamp-2 max-w-xs">{i.description}</td>
                  <td className="p-3">{i.reported_by?.full_name || "Ẩn danh"}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        i.status === "Resolved"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {i.status !== "Resolved" ? (
                      <button
                        onClick={() => handleResolve(i._id)}
                        className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700"
                      >
                        Giải quyết
                      </button>
                    ) : (
                      <CheckCircle className="inline text-green-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StaffIncidentScreen;
