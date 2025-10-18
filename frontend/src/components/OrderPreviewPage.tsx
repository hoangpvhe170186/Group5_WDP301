"use client";

import { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderPreviewPage() {
  const [items, setItems] = useState([
    { description: "", quantity: 1, weight: 0, fragile: false },
  ]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");

  const handleChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, weight: 0, fragile: false }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return alert("Bạn cần đăng nhập!");

      const res = await axios.post(
        "http://localhost:4000/api/orders/items",
        { order_id: orderId, items },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        alert("🎉 Xác nhận đơn hàng thành công!");
        navigate("/"); // trở về trang chủ
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi gửi chi tiết hàng hóa!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl mt-10">
      <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-5">
        <CardTitle className="text-2xl font-bold text-center">📦 Chi tiết hàng hóa</CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <form onSubmit={handleSubmit}>
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50 mb-4">
              <Label>Mô tả hàng hóa</Label>
              <input
                type="text"
                className="w-full border p-2 rounded-md"
                value={item.description}
                onChange={(e) => handleChange(index, "description", e.target.value)}
                required
              />

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Số lượng</Label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded-md"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleChange(index, "quantity", parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label>Trọng lượng (kg)</Label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded-md"
                    step="0.1"
                    min="0"
                    value={item.weight}
                    onChange={(e) => handleChange(index, "weight", parseFloat(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.fragile}
                    onChange={(e) => handleChange(index, "fragile", e.target.checked)}
                  />
                  <Label>Dễ vỡ</Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.moldy}
                    onChange={(e) => handleChange(index, "moldy", e.target.checked)}
                  />
                  <Label>Ẩm mốc</Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.temperature_sensitive}
                    onChange={(e) => handleChange(index, "temperature_sensitive", e.target.checked)}
                  />
                  <Label>Nhiệt độ thích hợp</Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.keep_dry}
                    onChange={(e) => handleChange(index, "keep_dry", e.target.checked)}
                  />
                  <Label>Giữ khô ráo</Label>
                </div>
              </div>

              {items.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  className="bg-red-500 text-white"
                  onClick={() => removeItem(index)}
                >
                  🗑 Xóa
                </Button>
              )}
            </div>
          ))}

          <div className="flex justify-between mt-4">
            <Button type="button" onClick={addItem} className="bg-blue-500 hover:bg-blue-600 text-white">
              ➕ Thêm hàng hóa
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {loading ? "Đang gửi..." : "✅ Xác nhận đơn hàng"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}