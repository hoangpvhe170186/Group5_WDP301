"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Eye, Truck, CheckCircle, Search, MessageCircle } from "lucide-react";
import OrderDetailModal from "./OrderDetailModal";
import OrderActionModal from "./OrderActionModal";
import SellerChat from "./SellerChat";
import io from "socket.io-client";
import { socket } from "@/lib/socket";

const ITEMS_PER_PAGE = 8;

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatRoom, setCurrentChatRoom] = useState("");
  const [currentOrderCode, setCurrentOrderCode] = useState("");
  const [currentCustomerName, setCurrentCustomerName] = useState("");

  // ✅ Mở chat theo CUSTOMER ID thay vì ORDER ID
  const openOrderChat = (order: any) => {
    const customerId = order.customer_id?._id || order.customer_id;

    if (!customerId) {
      setMessage("❌ Không tìm thấy thông tin khách hàng");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const chatRoomId = `customer:${customerId}`; // 🔹 Gộp theo customer
    setCurrentChatRoom(chatRoomId);
    setCurrentOrderCode(order.orderCode);
    setCurrentCustomerName(order.customer_id?.full_name || "Khách hàng");
    setIsChatOpen(true);

    // ✅ Tạo link chat cho khách hàng
    const customerChatLink = `${window.location.origin}/chat/customer/${customerId}`;

    navigator.clipboard.writeText(customerChatLink).then(() => {
      setMessage(`✅ Đã copy link chat! Gửi link này cho khách hàng: ${customerChatLink}`);
      setTimeout(() => setMessage(""), 5000);
    });
  };

  // 🧠 Lấy danh sách đơn hàng

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await axios.get("http://localhost:4000/api/users/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(res.data || []);

      // ✅ Join rooms sau khi fetch
      (res.data || []).forEach((order) => {
        const room = `order:${order._id}`;
        socket.emit("join_room", room);
        console.log(`📡 Seller joined room: ${room}`);
      });
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchOrders();
  }, []);

  // 🧩 Lắng nghe socket cập nhật trạng thái đơn hàng realtime
  useEffect(() => {
    const sellerId = localStorage.getItem("seller_id");

    const handleConnect = () => {
      console.log("🟢 Seller socket connected:", socket.id);
      if (sellerId) {
        socket.emit("join_seller", sellerId);
        console.log(`✅ Joined seller room: seller:${sellerId}`);
      }
    };

    const handleOrderUpdated = (data: any) => {
      console.log("🔁 Received order update:", data);

      setOrders((prev) =>
        prev.map((o) =>
          o._id === data.orderId ? { ...o, status: data.status } : o
        )
      );

      // 🟦 Toast thông báo realtime
      const toast = document.createElement("div");
      toast.textContent = `🚚 Đơn ${data.orderId} → ${data.status}`;
      Object.assign(toast.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#2563eb",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "14px",
        zIndex: 9999,
      });
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    };

    socket.on("connect", handleConnect);
    socket.on("order:updated", handleOrderUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("order:updated", handleOrderUpdated);
    };
  }, []);


  // ✅ Hàm xác nhận đơn
  const handleConfirmOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return alert("Bạn cần đăng nhập!");

      const res = await axios.post(
        `http://localhost:4000/api/users/orders/${orderId}/confirm`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
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
  // 🏷️ Status Badge
  const StatusBadge = ({ text }: { text: string }) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800" },
      ASSIGNED: { label: "Đã giao việc", color: "bg-purple-100 text-purple-800" },
      ACCEPTED: { label: "Đã chấp nhận", color: "bg-green-100 text-green-800" },
      CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800" },
      ON_THE_WAY: { label: "Đang di chuyển", color: "bg-indigo-100 text-indigo-800" },
      ARRIVED: { label: "Đã tới nơi", color: "bg-cyan-100 text-cyan-800" },
      DELIVERED: { label: "Đã giao", color: "bg-emerald-100 text-emerald-800" },
      COMPLETED: { label: "Hoàn tất", color: "bg-green-200 text-green-800" },
      INCIDENT: { label: "Đang gặp sự cố", color: "bg-orange-100 text-orange-800" },
      PAUSED: { label: "Tạm dừng", color: "bg-slate-100 text-slate-800" },
      NOTE: { label: "Ghi chú", color: "bg-gray-200 text-gray-800" },
      DECLINED: { label: "Từ chối", color: "bg-red-100 text-red-800" },
      CANCELLED: { label: "Đã huỷ", color: "bg-gray-200 text-gray-700" },
    };

    const s = statusMap[text?.toUpperCase()] || { label: text, color: "bg-gray-100 text-gray-700" };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}
      >
        {s.label}
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
          <option value="PENDING">Chờ xử lý</option>
          <option value="ASSIGNED">Đã giao việc</option>
          <option value="ACCEPTED">Đã chấp nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="ON_THE_WAY">Đang di chuyển</option>
          <option value="ARRIVED">Đã tới nơi</option>
          <option value="DELIVERED">Đã giao</option>
          <option value="COMPLETED">Hoàn tất</option>
          <option value="INCIDENT">Đang gặp sự cố</option>
          <option value="PAUSED">Tạm dừng</option>
          <option value="NOTE">Ghi chú</option>
          <option value="DECLINED">Từ chối</option>
          <option value="CANCELLED">Đã huỷ</option>
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
                        className={`text-xs font-medium ${order.isPaid ? "text-green-600" : "text-red-500"
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

                    {/* ✅ Nút nhắn tin - GỘP THEO CUSTOMER */}
                    <button
                      onClick={() => openOrderChat(order)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Nhắn tin với khách hàng"
                    >
                      <MessageCircle className="w-5 h-5 cursor-pointer" />
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
                    {(order.status === "ASSIGNED" || order.status === "DECLINED") && (
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
              className={`px-3 py-1 border rounded-lg text-sm ${currentPage === i + 1
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

      {/* ✅ Modal Chat - Hiển thị tên khách hàng */}
      {isChatOpen && currentChatRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-orange-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  💬 Chat với {currentCustomerName}
                </h3>
                <p className="text-sm text-gray-600">
                  Đơn hàng hiện tại: <strong>#{currentOrderCode}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Room: <code>{currentChatRoom}</code>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const customerChatLink = `${window.location.origin}/chat/customer/${currentChatRoom.replace("customer:", "")}`;
                    navigator.clipboard.writeText(customerChatLink);
                    setMessage("✅ Đã copy link chat!");
                    setTimeout(() => setMessage(""), 3000);
                  }}
                  className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  title="Copy link chat cho khách hàng"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Nội dung chat */}
            <div className="flex-1">
              <SellerChat
                roomId={currentChatRoom}
                orderInfo={{
                  code: currentOrderCode,
                  status: "Đang xử lý",
                  customerName: currentCustomerName,
                }}
              />
            </div>
          </div>
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