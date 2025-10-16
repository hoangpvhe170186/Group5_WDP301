"use client";

import { useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function OrderSearch() {
  const [keyword, setKeyword] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return alert("Vui lòng nhập mã đơn hàng hoặc số điện thoại");

    setLoading(true);
    setOrders([]);
    setExpanded(null);

    try {
      const isPhone = /^[0-9+]{9,11}$/.test(keyword);
      const url = isPhone
        ? `http://localhost:4000/api/orders/search?phone=${keyword}`
        : `http://localhost:4000/api/orders/search?id=${keyword}`;

      const res = await axios.get(url);

      if (!res.data.success || !Array.isArray(res.data.orders) || res.data.orders.length === 0) {
  alert(res.data.message || "Không tìm thấy đơn hàng!");
  return;
}

      setOrders(res.data.orders);
    } catch (err) {
      console.error("❌ Lỗi khi tìm đơn hàng:", err);
      alert("Không thể tìm thấy đơn hàng này!");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-10 shadow-xl border rounded-2xl bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 rounded-t-2xl">
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          🔍 Tra cứu đơn hàng
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        <div>
          <Label className="font-semibold text-gray-700">Nhập mã đơn hàng hoặc số điện thoại</Label>
          <input
            type="text"
            className="border rounded-md p-2 w-full mt-1 focus:border-green-600 focus:ring-1 focus:ring-green-400"
            placeholder="VD: 670f8b7c9c4a56314dbde123 hoặc 0901234567"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <Button
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 font-semibold rounded-md"
        >
          {loading ? "Đang tìm..." : "🔍 Tìm đơn hàng"}
        </Button>

        {orders.length > 0 && (
          <div className="mt-5 space-y-4">
            <h3 className="text-lg font-bold text-gray-700">
              🧾 Kết quả: {orders.length} đơn hàng tìm thấy
            </h3>

            {orders.map((order) => (
              <div
                key={order._id}
                className="border rounded-lg bg-gray-50 shadow-sm p-4 transition-all hover:shadow-md cursor-pointer"
                onClick={() => toggleExpand(order._id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">
                      🆔 Mã: <span className="text-blue-600">{order._id}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      💰 {Number(order.total_price).toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    🕒 {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>

                {expanded === order._id && (
                  <div className="mt-3 border-t pt-3 text-sm text-gray-700 space-y-1 animate-fadeIn">
                    <p><strong>📞 SĐT:</strong> {order.phone}</p>
                    <p><strong>🚚 Giao hàng:</strong> {order.delivery_address}</p>
                    <p><strong>📦 Gói:</strong> {order.pricepackage_id?.name}</p>
                    <p><strong>👷 Nhân công:</strong> {order.pricepackage_id?.workers}</p>
                    <p><strong>🏢 Tầng tối đa:</strong> {order.pricepackage_id?.max_floor}</p>
                    <p><strong>💰 Cước cơ bản:</strong>{" "}
                      {Number(order.pricepackage_id?.base_price?.$numberDecimal || 0).toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
