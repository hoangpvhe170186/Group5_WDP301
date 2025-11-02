"use client";
import React, { useState } from "react";
import axios from "axios";
import { Package, Eye, CheckSquare, X } from "lucide-react";
import EditPackageModal from "./EditPackageModal";
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
  const [step, setStep] = useState("input"); // "input" | "confirmation"
  const [isEditPackageOpen, setIsEditPackageOpen] = useState(false);
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
    }catch (err) {
        console.error("❌ Lỗi khi thêm sản phẩm:", err);
        const message =
          err.response?.data?.message ||
          err.message ||
          "Lỗi không xác định từ server!";

        // ⚠️ Nếu lỗi do vượt giới hạn trọng lượng
        if (message.includes("vượt quá giới hạn")) {
          if (confirm(`${message}\n\nBạn có muốn đổi sang gói khác không?`)) {
            setIsEditPackageOpen(true); // mở modal đổi gói
          }
        } else {
          alert("⚠ " + message);
        }
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

        {/* ✅ Modal đổi gói dịch vụ */}
        {isEditPackageOpen && (
          <EditPackageModal
            orderId={order._id}
            onClose={() => setIsEditPackageOpen(false)}
            onUpdated={() => {
              setIsEditPackageOpen(false);
              onSuccess();
            }}
          />
        )}
      </div>
    );
  };

  export default OrderItemModal;