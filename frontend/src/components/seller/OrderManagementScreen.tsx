"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Eye, Truck, CheckCircle, Search } from "lucide-react";
import OrderDetailModal from "./OrderDetailModal";
import OrderActionModal from "./OrderActionModal";

const ITEMS_PER_PAGE = 8; // số đơn / trang

const OrderManagementScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrderDetailId, setSelectedOrderDetailId] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Bộ lọc
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);

  // 🧠 Lấy danh sách đơn hàng
  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/users/orders/");
      setOrders(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ✅ Hàm xác nhận đơn
  const handleConfirmOrder = async (orderId) => {
    try {
      const res = await axios.post(
        `http://localhost:4000/api/users/orders/${orderId}/confirm`
      );
      if (res.data.success) {
        setMessage("✅ Đơn hàng đã được xác nhận!");
        await fetchOrders();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("⚠️ Không thể xác nhận đơn!");
      }
    } catch (error) {
      console.error("❌ Lỗi khi xác nhận đơn:", error);
      setMessage("🚨 Lỗi máy chủ khi xác nhận đơn!");
    }
  };

  // 🎯 Lọc đơn hàng theo từ khóa + trạng thái
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderCode?.toLowerCase().includes(search.toLowerCase()) ||
        o.pickup_address?.toLowerCase().includes(search.toLowerCase()) ||
        o.delivery_address?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "All" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  // 🧮 Tính phân trang
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 🏷️ Status Badge
  const StatusBadge = ({ text }) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Assigned: "bg-purple-100 text-purple-800",
      Accepted: "bg-green-100 text-green-800",
      Confirmed: "bg-blue-100 text-blue-800",
      On_the_way: "bg-indigo-100 text-indigo-800",
      Arrived: "bg-cyan-100 text-cyan-800",
      Completed: "bg-emerald-100 text-emerald-800",
      Decline: "bg-red-100 text-red-800",
      Cancel: "bg-gray-300 text-gray-700",
      Incident: "bg-orange-100 text-orange-800",
      Pause: "bg-slate-200 text-slate-800",
    };
    const colorClass = colors[text] || "bg-gray-100 text-gray-800";
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
      >
        {text}
      </span>
    );
  };

  if (loading) return <p className="text-gray-500">Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Quản lý Đơn hàng</h1>

      {message && (
        <div className="p-3 text-center text-sm bg-green-50 text-green-700 rounded-md">
          {message}
        </div>
      )}

      {/* 🎯 Bộ lọc */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        {/* Ô tìm kiếm */}
        <div className="flex items-center border rounded-lg px-3 py-2 w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Tìm theo mã, địa chỉ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm text-gray-700"
          />
        </div>

        {/* Bộ lọc trạng thái */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="Pending">Pending</option>
          <option value="Assigned">Assigned</option>
          <option value="Accepted">Accepted</option>
          <option value="Confirmed">Confirmed</option>
          <option value="On_the_way">On_the_way</option>
          <option value="Arrived">Arrived</option>
          <option value="Completed">Completed</option>
          <option value="Decline">Decline</option>
          <option value="Cancel">Cancel</option>
        </select>
      </div>

      {/* 🧾 Bảng đơn hàng */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-28">
                Mã Đơn
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-60">
                Địa chỉ lấy hàng
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-60">
                Địa chỉ giao hàng
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-40">
                Gói
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-40">
                Thời gian
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-40">
                Chi phí
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-32">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 w-32">
                Hành động
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  Không có đơn hàng nào phù hợp.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    #{order.orderCode}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[14rem]">
                    {order.pickup_address}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[14rem]">
                    {order.delivery_address}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {order.package_id?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {order.scheduled_time
                      ? new Date(order.scheduled_time).toLocaleString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span>{order.total_price.toLocaleString()}₫</span>
                      <span
                        className={`text-xs font-medium ${
                          order.isPaid ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {order.isPaid ? "Đã TT" : "Chưa TT"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge text={order.status} />
                  </td>

                  <td className="px-4 py-3 text-right text-sm font-medium flex justify-end gap-3">
                    {/* Xem chi tiết */}
                    <button
                      onClick={() => {
                        setSelectedOrderDetailId(order._id);
                        setIsDetailOpen(true);
                      }}
                      className="text-orange-600 hover:text-orange-900"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-5 h-5 cursor-pointer" />
                    </button>

                    {/* Xác nhận đơn */}
                    {order.status === "Pending" && (
                      <button
                        onClick={() => handleConfirmOrder(order._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Xác nhận đơn"
                      >
                        <CheckCircle className="w-5 h-5 cursor-pointer" />
                      </button>
                    )}

                    {/* Cập nhật / Giao việc */}
                    {(order.status === "Assigned" || order.status === "Decline") && (
                      <button
                        onClick={() => {
                          setSelectedOrderId(order._id);
                          setIsUpdateModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Cập nhật / Giao việc"
                      >
                        <Truck className="w-5 h-5 cursor-pointer" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 📄 Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Trước
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded-lg text-sm ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* Modal chi tiết */}
      {isDetailOpen && selectedOrderDetailId && (
        <OrderDetailModal
          orderId={selectedOrderDetailId}
          onClose={() => setIsDetailOpen(false)}
        />
      )}

      {/* Modal giao việc */}
      {isUpdateModalOpen && selectedOrderId && (
        <OrderActionModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          orderId={selectedOrderId}
        />
      )}
    </div>
  );
};

export default OrderManagementScreen;
