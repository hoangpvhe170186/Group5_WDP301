"use client";

import { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export default function OrderPreviewPage() {
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
  const [scheduleType, setScheduleType] = useState("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");

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

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      alert("Bạn cần đăng nhập!");
      return;
    }

    let deliveryTime = null;
    if (scheduleType === "later") {
      if (!scheduledDate || !scheduledTime) {
        alert("Vui lòng chọn ngày và giờ giao hàng!");
        return;
      }
      deliveryTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    const res = await axios.post(
      "http://localhost:4000/api/orders/items",
      {
        order_id: orderId,
        items,
        delivery_schedule: {
          type: scheduleType,
          datetime: deliveryTime || new Date().toISOString(),
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.data?.success) {
      alert(res.data?.message || "Có lỗi xảy ra!");
      return;
    }

    alert("🎉 Xác nhận đơn hàng thành công!");
    navigate("/");
  } catch (err) {
    console.error("❌ Lỗi khi gửi hàng hóa:", err);

    const message =
      err.response?.data?.message ||
      err.message ||
      "Lỗi không xác định từ server!";

    alert("⚠ " + message);
  } finally {
    setLoading(false);
  }
};

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

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg mt-10 border border-gray-200">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 flex justify-between items-center">
        <CardTitle className="text-2xl font-bold text-center flex-1">
          📦 Chi tiết hàng hóa
        </CardTitle>
        <Button
          type="button"
          onClick={() => navigate("/dat-hang")}
          className="bg-white text-orange-600 hover:bg-orange-100 font-semibold px-4 py-2 rounded-lg"
        >
          Quay lại
        </Button>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          {/* Lịch giao hàng */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50 shadow-sm">
            <Label className="font-semibold text-gray-700 mb-2 block">
              Thời gian giao hàng
            </Label>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <select
                value={scheduleType}
                onChange={(e) =>
                  setScheduleType(e.target.value as "now" | "later")
                }
                className="border border-gray-300 rounded-lg p-2 w-full md:w-1/2"
              >
                <option value="now">Bây giờ (1-2 giờ tùy thuộc vào tài xế )</option>
                <option value="later">Đặt lịch</option>
              </select>
            </div>

            {/* Khi chọn Đặt lịch thì hiện lịch + giờ */}
            {scheduleType === "later" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-gray-700"> Ngày giao</Label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    className="border border-gray-300 rounded-lg p-2 w-full mt-1"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="font-semibold text-gray-700"> Giờ giao</Label>
                  <input
                    type="time"
                    className="border border-gray-300 rounded-lg p-2 w-full mt-1"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* DANH SÁCH HÀNG HÓA */}
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-5 space-y-4 bg-gray-50 mb-6 shadow-sm relative">
              <div>
                <Label className="font-semibold">Mô tả hàng hóa</Label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  placeholder="Ví dụ: Tủ lạnh, Ghế sofa..."
                  value={item.description}
                  onChange={(e) => handleChange(index, "description", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleDeleteItem(index)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                  title="Xóa hàng hóa này"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Số lượng</Label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border rounded-md p-2"
                    value={item.quantity}
                    onChange={(e) => handleChange(index, "quantity", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="font-semibold">Trọng lượng (kg)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full border rounded-md p-2"
                    value={item.weight}
                    onChange={(e) => handleChange(index, "weight", parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* Loại hàng */}
              <div>
                <Label className="font-semibold">Loại hàng vận chuyển</Label>
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
                <Label className="font-semibold">Hướng dẫn vận chuyển</Label>
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
                <Label className="font-semibold">Ghi chú cho tài xế</Label>
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
              <Button
                type="button"
                onClick={handleAddItem}
                className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                ➕ Thêm hàng hóa
              </Button>
            </div>
          ))}

          {/* Nút Xác nhận */}
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white font-semibold"
            >
              {loading ? "Đang gửi..." : "✅ Xác nhận đơn hàng"}
            </Button>
          </div>  
        </form>
      </CardContent>
    </Card>
  );
}
