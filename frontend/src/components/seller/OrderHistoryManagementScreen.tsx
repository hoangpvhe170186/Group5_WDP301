"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Eye, Search } from "lucide-react";
import OrderDetailModal from "@/components/seller/OrderDetailModal";

const ITEMS_PER_PAGE = 8;

const OrderHistoryManagementScreen = () => {
  const [orders, setOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // 🧠 Lấy tất cả đơn hàng COMPLETED hoặc CANCELLED
  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/users/orders/history");
      setOrders(res.data || []);

      // Lấy feedback từng đơn
      const fbData = {};
      for (const order of res.data) {
        const fbRes = await axios.get(
          `http://localhost:4000/api/users/feedback/order/${order._id}`
        );
        if (fbRes.data) fbData[order._id] = fbRes.data;
      }
      setFeedbacks(fbData);
    } catch (err) {
      console.error("❌ Lỗi tải lịch sử đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🎯 Lọc theo từ khóa
  const filteredOrders = useMemo(() => {
    return orders.filter((o) =>
      [o.orderCode, o.pickup_address, o.delivery_address]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [orders, search]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const StatusBadge = ({ text }) => {
    const colors = {
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-200 text-gray-700",
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

  if (loading)
    return <p className="text-gray-500">Đang tải lịch sử đơn hàng...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        📦 Lịch sử đơn hàng (Nhân viên)
      </h1>

      {/* Ô tìm kiếm */}
      <div className="flex items-center border rounded-lg px-3 py-2 w-full sm:w-64 bg-white shadow-sm">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Tìm theo mã, địa chỉ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-sm text-gray-700"
        />
      </div>

      {/* 🧾 Bảng đơn hàng */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-500 uppercase text-xs font-medium">Mã đơn</th>
              <th className="px-4 py-3 text-left text-gray-500 uppercase text-xs font-medium">Địa chỉ lấy</th>
              <th className="px-4 py-3 text-left text-gray-500 uppercase text-xs font-medium">Địa chỉ giao</th>
              <th className="px-4 py-3 text-gray-500 uppercase text-xs font-medium">Tổng tiền</th>
              <th className="px-4 py-3 text-gray-500 uppercase text-xs font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-gray-500 uppercase text-xs font-medium">Chi tiết</th>
              <th className="px-4 py-3 text-gray-500 uppercase text-xs font-medium">Đánh giá</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Không có đơn hàng nào.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => {
                const fb = feedbacks[order._id];
                return (
                  <tr key={order._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      #{order.orderCode}
                    </td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[10rem]">
                      {order.pickup_address}
                    </td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[10rem]">
                      {order.delivery_address}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {order.total_price?.toLocaleString()}₫
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge text={order.status} />
                    </td>

                    {/* 🔍 Chi tiết */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedOrderId(order._id);
                          setIsDetailOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-5 h-5 mx-auto" />
                      </button>
                    </td>

                    {/* ⭐ Đánh giá */}
                    <td className="px-4 py-3 text-center">
                      {fb ? (
                        <div className="flex flex-col items-center text-yellow-500">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <span key={i}>{i <= fb.rating ? "⭐" : "☆"}</span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 italic mt-1 max-w-[8rem] truncate">
                            {fb.comment}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">
                          Chưa có đánh giá
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
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

      {/* 🪟 Modal chi tiết */}
      {isDetailOpen && selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </div>
  );
};

export default OrderHistoryManagementScreen;
