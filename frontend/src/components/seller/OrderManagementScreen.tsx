"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Eye, Truck, CheckCircle, Search, MessageCircle, Package, CheckSquare, X, Camera,XCircle } from "lucide-react";
import OrderDetailModal from "./OrderDetailModal";
import OrderActionModal from "./OrderActionModal";
import SellerChat from "./SellerChat";
import OrderItemModal from "./OrderItemModal";
import EditPackageModal from "./EditPackageModal";
import OrderImageUploadModal from "./OrderImageUploadModal"; // Import component mới

const ITEMS_PER_PAGE = 8;
import { socket } from "@/lib/socket";

type OrderLite = {
  _id: string;
  orderCode: string;
  pickup_address: string;
  delivery_address: string;
  total_price: number;
  isPaid: boolean;
  status: string;
  seller_id?: string | { _id: string } | null;
  package_id?: { name?: string } | null;
  scheduled_time?: string | number | Date | null;
  customer_id?: string | { _id: string; full_name?: string } | null;
};


const OrderManagementScreen = () => {
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrderDetailId, setSelectedOrderDetailId] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedOrderForItems, setSelectedOrderForItems] = useState(null);
  const [isEditPackageOpen, setIsEditPackageOpen] = useState(false);
  const [orderForEditPackage, setOrderForEditPackage] = useState(null);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false); // Modal upload ảnh
  const [selectedOrderForImages, setSelectedOrderForImages] = useState(null);

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

    const chatRoomId = `customer:${customerId}`;
    setCurrentChatRoom(chatRoomId);
    setCurrentOrderCode(order.orderCode);
    setCurrentCustomerName(order.customer_id?.full_name || "Khách hàng");
    setIsChatOpen(true);

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders((res.data || []) as OrderLite[]);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // join broadcast room for sellers
    socket.emit("join", { role: "seller" });

    const onSellerClaimed = (payload: { orderId: string; sellerId: string }) => {
      setOrders((prev) => prev.filter((o) => o._id !== payload.orderId));
    };

    socket.on("order:seller_claimed", onSellerClaimed);
    return () => {
      socket.off("order:seller_claimed", onSellerClaimed);
    };
  }, []);

  // ✅ Seller nhận đơn Pending (chưa có seller)
  const handleSellerAccept = async (orderId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return alert("Bạn cần đăng nhập!");

      const res = await axios.post(
        `http://localhost:4000/api/users/orders/${orderId}/claim-seller`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setMessage("✅ Nhận đơn thành công!");
        await fetchOrders();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("⚠️ Không thể nhận đơn này");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "🚨 Lỗi khi nhận đơn";
      setMessage(msg);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  // ✅ Hàm xác nhận đơn
  const handleConfirmOrder = async (orderId: string) => {
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

  const handleCancelOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return alert("Bạn cần đăng nhập!");

      const res = await axios.post(
        `http://localhost:4000/api/users/orders/${orderId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.success) {
        setMessage("✅ Đơn hàng đã được hủy!");
        await fetchOrders();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("⚠️ Không thể hủy đơn!");
      }
    } catch (error) {
      console.error("❌ Lỗi khi xác nhận đơn:", error);
      setMessage("🚨 Lỗi máy chủ khi hủy đơn!");
    }
  };

  // 🎯 Lọc đơn hàng theo từ khóa + trạng thái
  const filteredOrders = useMemo(() => {
    return orders.filter((o: OrderLite) => {
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
  const StatusBadge = ({ text }: { text: string }) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ASSIGNED: "bg-purple-100 text-purple-800",
      ACCEPTED: "bg-green-100 text-green-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      ON_THE_WAY: "bg-indigo-100 text-indigo-800",
      ARRIVED: "bg-cyan-100 text-cyan-800",
      COMPLETED: "bg-emerald-100 text-emerald-800",
      DECLINED: "bg-red-100 text-red-800",
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

  const pendingNoSeller = useMemo(
    () => orders.filter((o: OrderLite) => o.status === "Pending" && !o.seller_id),
    [orders]
  );


  if (loading) return <p className="text-gray-500">Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Quản lý Đơn hàng</h1>

      {message && (
        <div className="p-3 text-center text-sm bg-green-50 text-green-700 rounded-md">
          {message}
        </div>
      )}
      {/* 🔶 Danh sách đơn Pending chưa có seller (dạng thẻ nhỏ gọn) */}
      {pendingNoSeller.length > 0 && (
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Đơn chờ nhận (Pending, chưa có seller)
            </h2>
            <span className="text-xs text-gray-500">{pendingNoSeller.length} đơn</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pendingNoSeller.map((o) => (
              <div key={o._id} className="border rounded-lg p-3 hover:shadow-sm transition flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">#{o.orderCode}</span>
                  <StatusBadge text={o.status} />
                </div>
                <div className="text-sm text-gray-700">
                  <div className="truncate" title={o.pickup_address}>📦 {o.pickup_address}</div>
                  <div className="truncate" title={o.delivery_address}>📍 {o.delivery_address}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-900">{(o.total_price || 0).toLocaleString()}₫</span>
                  <button
                    onClick={() => handleSellerAccept(o._id)}
                    className="px-3 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700"
                  >
                    Chấp nhận
                  </button>
                </div>
              </div>
            ))}
          </div>
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

                    {/* ✅ Nút nhắn tin */}
                    <button
                      onClick={() => openOrderChat(order)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Nhắn tin với khách hàng"
                    >
                      <MessageCircle className="w-5 h-5 cursor-pointer" />
                    </button>

                    {/* 📸 Upload ảnh - Chỉ hiện khi status là Pending */}
                    {order.status === "Pending" && (
                      <button
                        onClick={() => {
                          setSelectedOrderForImages(order);
                          setIsImageUploadOpen(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="Upload ảnh đơn hàng"
                      >
                        <Camera className="w-5 h-5 cursor-pointer" />
                      </button>
                    )}

                    {/* Thêm chi tiết sản phẩm - Chỉ hiện khi status là Pending */}
                    {order.status === "Pending" && (
                      <button
                        onClick={() => {
                          setSelectedOrderForItems(order);
                          setIsItemModalOpen(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="Thêm chi tiết sản phẩm"
                      >
                        <Package className="w-5 h-5 cursor-pointer" />
                      </button>
                    )}

                    {/* 🔧 Nút Đổi gói */}
                    {order.status === "Pending" && (
                      <button
                        onClick={() => {
                          setOrderForEditPackage(order);
                          setIsEditPackageOpen(true);
                        }}
                        className="text-orange-500 hover:text-orange-700"
                        title="Đổi gói dịch vụ"
                      >
                        <CheckSquare className="w-5 h-5" />
                      </button>
                    )}

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
                    {order.status === "Pending" && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Xác nhận đơn"
                      >
                        <XCircle className="w-5 h-5 cursor-pointer" />
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

      {/* ✅ Modal Upload Ảnh */}
      {isImageUploadOpen && selectedOrderForImages && (
        <OrderImageUploadModal
          isOpen={isImageUploadOpen}
          onClose={() => {
            setIsImageUploadOpen(false);
            setSelectedOrderForImages(null);
          }}
          order={selectedOrderForImages}
          onSuccess={() => {
            fetchOrders();
            setIsImageUploadOpen(false);
            setSelectedOrderForImages(null);
          }}
        />
      )}

      {/* ✅ Modal Thêm chi tiết sản phẩm */}
      {isItemModalOpen && selectedOrderForItems && (
        <OrderItemModal
          isOpen={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false);
            setSelectedOrderForItems(null);
          }}
          order={selectedOrderForItems}
          onSuccess={() => {
            fetchOrders();
            setIsItemModalOpen(false);
            setSelectedOrderForItems(null);
          }}
        />
      )}

      {/* ✅ Modal Chat */}
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

      {/* ✅ Modal đổi gói dịch vụ */}
      {isEditPackageOpen && orderForEditPackage && (
        <EditPackageModal
          orderId={orderForEditPackage._id}
          onClose={() => setIsEditPackageOpen(false)}
          onUpdated={() => {
            setIsEditPackageOpen(false);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};

export default OrderManagementScreen;