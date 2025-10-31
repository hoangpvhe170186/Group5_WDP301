"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Eye, Truck, CheckCircle, Search, MessageCircle, Package, CheckSquare, X } from "lucide-react";
import OrderDetailModal from "./OrderDetailModal";
import OrderActionModal from "./OrderActionModal";
import SellerChat from "./SellerChat";

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
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedOrderForItems, setSelectedOrderForItems] = useState(null);

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
  const StatusBadge = ({ text }) => {
    const colors = {
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

                    {/* ✅ Nút nhắn tin */}
                    <button
                      onClick={() => openOrderChat(order)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Nhắn tin với khách hàng"
                    >
                      <MessageCircle className="w-5 h-5 cursor-pointer" />
                    </button>

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
    </div>
  );
};

// Component Modal Thêm chi tiết sản phẩm
const OrderItemModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [items, setItems] = useState([
    {
      description: "",
      quantity: 1,
      weight: 0,
      fragile: false,
      type: [],
      shipping_instructions: [],
      driver_note: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [step, setStep] = useState("input"); // "input" | "confirmation"

  const itemTypes = [
    "Thực phẩm & Đồ uống",
    "Văn phòng phẩm",
    "Quần áo & Phụ kiện",
    "Đồ điện tử",
    "Nguyên vật liệu / Linh kiện",
    "Đồ gia dụng / Nội thất",
    "Khác",
  ];

  const shippingOptions = [
    "Hàng dễ vỡ",
    "Giữ khô ráo",
    "Cần nhiệt độ thích hợp",
    "Thực phẩm có mùi",
  ];

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        weight: 0,
        fragile: false,
        type: [],
        shipping_instructions: [],
        driver_note: "",
      },
    ]);
  };

  const handleDeleteItem = (index) => {
    if (items.length === 1) {
      return alert("Phải có ít nhất 1 hàng hóa");
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const toggleType = (index, type) => {
    const updated = [...items];
    const types = updated[index].type;
    updated[index].type = types.includes(type)
      ? types.filter((t) => t !== type)
      : [...types, type];
    setItems(updated);
  };

  const toggleShippingInstruction = (index, instruction) => {
    const updated = [...items];
    const current = updated[index].shipping_instructions;
    updated[index].shipping_instructions = current.includes(instruction)
      ? current.filter((i) => i !== instruction)
      : [...current, instruction];
    setItems(updated);
  };

  const handlePreview = () => {
    // Kiểm tra dữ liệu bắt buộc
    for (let i = 0; i < items.length; i++) {
      if (!items[i].description.trim()) {
        alert(`Vui lòng nhập mô tả cho hàng hóa thứ ${i + 1}`);
        return;
      }
    }
    setStep("confirmation");
  };

  const handleBackToEdit = () => {
    setStep("input");
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        alert("Bạn cần đăng nhập!");
        return;
      }

      const res = await axios.post(
        "http://localhost:4000/api/orders/items",
        {
          order_id: order._id,
          items,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data?.success) {
        alert(res.data?.message || "Có lỗi xảy ra!");
        return;
      }

      alert("✅ Đã thêm chi tiết sản phẩm thành công!");
      onSuccess();
    } catch (err) {
      console.error("❌ Lỗi khi thêm sản phẩm:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Lỗi không xác định từ server!";
      alert("⚠ " + message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-center flex-1">
            {step === "input" ? "📦 Thêm chi tiết hàng hóa" : "👀 Xác nhận thông tin hàng hóa"}
          </h2>
          <button
            onClick={onClose}
            className="bg-white text-orange-600 hover:bg-orange-100 font-semibold px-4 py-2 rounded-lg"
          >
            Đóng
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Mã đơn hàng:</strong> #{order.orderCode}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Lưu ý:</strong> Sau khi xác nhận, thông tin hàng hóa sẽ không thể sửa đổi hoặc xóa!
            </p>
          </div>

          {step === "input" ? (
            <form onSubmit={(e) => { e.preventDefault(); handlePreview(); }}>
              {/* DANH SÁCH HÀNG HÓA - NHẬP LIỆU */}
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-5 space-y-4 bg-gray-50 mb-6 shadow-sm relative">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-semibold text-lg text-gray-800">Hàng hóa #{index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1"
                      title="Xóa hàng hóa này"
                    >
                      <X className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>

                  <div>
                    <label className="font-semibold">Mô tả hàng hóa *</label>
                    <input
                      type="text"
                      className="w-full border rounded-md p-2 mt-1"
                      placeholder="Ví dụ: Tủ lạnh, Ghế sofa..."
                      value={item.description}
                      onChange={(e) => handleChange(index, "description", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold">Số lượng</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full border rounded-md p-2 mt-1"
                        value={item.quantity}
                        onChange={(e) => handleChange(index, "quantity", parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="font-semibold">Trọng lượng (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="w-full border rounded-md p-2 mt-1"
                        value={item.weight}
                        onChange={(e) => handleChange(index, "weight", parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Loại hàng */}
                  <div>
                    <label className="font-semibold">Loại hàng vận chuyển</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {itemTypes.map((type) => (
                        <label
                          key={type}
                          className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer text-sm transition-all ${item.type.includes(type)
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-300 hover:border-orange-300"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.type.includes(type)}
                            onChange={() => toggleType(index, type)}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Hướng dẫn vận chuyển */}
                  <div>
                    <label className="font-semibold">Hướng dẫn vận chuyển</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {shippingOptions.map((option) => (
                        <label
                          key={option}
                          className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer text-sm transition-all ${item.shipping_instructions.includes(option)
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-300 hover:border-orange-300"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.shipping_instructions.includes(option)}
                            onChange={() => toggleShippingInstruction(index, option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Ghi chú */}
                  <div>
                    <label className="font-semibold">Ghi chú cho tài xế</label>
                    <textarea
                      className="w-full border rounded-md p-2 mt-1"
                      placeholder="Ví dụ: Giao nhẹ tay, tránh nghiêng..."
                      value={item.driver_note}
                      onChange={(e) => handleChange(index, "driver_note", e.target.value)}
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-400 text-right">
                      {200 - item.driver_note.length} ký tự còn lại
                    </p>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddItem}
                className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                ➕ Thêm hàng hóa
              </button>

              {/* Nút hành động */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Xem trước & Xác nhận
                </button>
              </div>
            </form>
          ) : (
            /* BƯỚC XÁC NHẬN */
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Package className="w-5 h-5" />
                  <strong>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận!</strong>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Sau khi xác nhận, thông tin hàng hóa sẽ được gửi lên hệ thống và không thể thay đổi.
                </p>
              </div>

              {/* HIỂN THỊ TOÀN BỘ THÔNG TIN ĐÃ NHẬP */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Tổng quan đơn hàng
                </h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Mã đơn hàng:</span>
                    <span className="ml-2 text-blue-600">#{order.orderCode}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Tổng số mặt hàng:</span>
                    <span className="ml-2 text-green-600">{items.length} mặt hàng</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">
                  Chi tiết từng mặt hàng
                </h3>

                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-800 text-lg">Hàng hóa #{index + 1}</h4>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        STT: {index + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">Mô tả:</span>
                        <p className="mt-1 p-2 bg-gray-50 rounded border">{item.description || "Chưa có mô tả"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-semibold">Số lượng:</span>
                          <p className="mt-1 p-2 bg-gray-50 rounded border text-center">{item.quantity}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Trọng lượng:</span>
                          <p className="mt-1 p-2 bg-gray-50 rounded border text-center">{item.weight} kg</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">Loại hàng:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.type.length > 0 ? (
                            item.type.map((type, i) => (
                              <span key={i} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                                {type}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-xs">Không có loại hàng được chọn</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold">Hướng dẫn vận chuyển:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.shipping_instructions.length > 0 ? (
                            item.shipping_instructions.map((instruction, i) => (
                              <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {instruction}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-xs">Không có hướng dẫn đặc biệt</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {item.driver_note && (
                      <div className="mt-3 text-sm">
                        <span className="font-semibold">Ghi chú cho tài xế:</span>
                        <p className="mt-1 p-2 bg-blue-50 rounded border text-gray-700">{item.driver_note}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Nút hành động ở bước xác nhận */}
              <div className="flex justify-between gap-3 mt-8 pt-4 border-t">
                <button
                  onClick={handleBackToEdit}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Quay lại chỉnh sửa
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    {loading ? "Đang xác nhận..." : "Xác nhận & Lưu vào hệ thống"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagementScreen;