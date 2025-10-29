"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, AlertTriangle, X } from "lucide-react";
import { getCurrentUserId } from "@/lib/auth";

const ComplaintManagementScreen = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showModal, setShowModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolutionText, setResolutionText] = useState("");
  const [statusChoice, setStatusChoice] = useState("Resolved");

  const currentUserId = getCurrentUserId();

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

  // 🧩 Gửi cập nhật khiếu nại
  const handleResolveConfirm = async () => {
    if (!resolutionText.trim()) return alert("❌ Vui lòng nhập nội dung xử lý!");

    try {
      await axios.patch(`http://localhost:4000/api/users/incidents/${selectedIncident._id}/resolve`, {
        resolution: resolutionText,
        staffId: currentUserId,
        status: statusChoice,
      });

      setIncidents((prev) =>
        prev.map((r) =>
          r._id === selectedIncident._id
            ? { ...r, status: statusChoice, resolution: resolutionText }
            : r
        )
      );
      setShowModal(false);
      alert(`✅ Khiếu nại đã được ${statusChoice === "Resolved" ? "giải quyết" : "từ chối"}`);
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi cập nhật!");
    }
  };

  // 🧭 Bộ lọc và phân trang
  const filteredIncidents =
    filter === "All"
      ? incidents
      : incidents.filter((i) => i.status === filter);

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <p className="text-center py-10">Đang tải...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <AlertTriangle className="text-yellow-500" /> Danh sách khiếu nại khách hàng
      </h2>

      {/* Bộ lọc */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <label className="mr-2 font-medium">Lọc trạng thái:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="All">Tất cả</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Bảng */}
      {paginatedIncidents.length === 0 ? (
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
              {paginatedIncidents.map((i) => (
                <tr key={i._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{i.order_id?.orderCode}</td>
                  <td className="p-3">{i.type}</td>
                  <td className="p-3 line-clamp-2 max-w-xs">{i.description}</td>
                  <td className="p-3">{i.reported_by?.full_name || "Ẩn danh"}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        i.status === "Resolved"
                          ? "bg-green-100 text-green-700"
                          : i.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {i.status === "Pending" ? (
                      <button
                        onClick={() => {
                          setSelectedIncident(i);
                          setShowModal(true);
                        }}
                        className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
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

      {/* Phân trang */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={currentPage === 1}
        >
          Trước
        </button>
        <span>
          Trang {currentPage}/{totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={currentPage === totalPages}
        >
          Sau
        </button>
      </div>

      {/* Modal xử lý */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-semibold mb-4">
              Xử lý khiếu nại #{selectedIncident?.order_id?.orderCode}
            </h3>

            <label className="block text-sm font-medium mb-1">Trạng thái</label>
            <select
              value={statusChoice}
              onChange={(e) => setStatusChoice(e.target.value)}
              className="w-full border rounded p-2 mb-3"
            >
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <label className="block text-sm font-medium mb-1">
              Nội dung xử lý
            </label>
            <textarea
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              className="w-full border rounded p-2 mb-4"
              rows={3}
              placeholder="Nhập nội dung (VD: Đã hoàn tiền, thay hàng...)"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleResolveConfirm}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintManagementScreen;
