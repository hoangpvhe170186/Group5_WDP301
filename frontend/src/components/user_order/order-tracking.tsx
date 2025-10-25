"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import OrderTimeline from "./order-timeline";
import OrderDetails from "./order-details";
import OrderHeader from "./order-header";
import { orderApi } from "@/services/order.service";
import FeedbackForm from "./FeedbackForm";
import IncidentForm from "./IncidentForm";

export default function OrderTracking() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]); // 🟢 lưu danh sách items của order hiện tại
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  // 🔹 Lấy danh sách đơn hàng của người dùng
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { orders: fetchedOrders } = await orderApi.listMyOrders();
        setOrders(fetchedOrders || []);
        if (fetchedOrders && fetchedOrders.length > 0) {
          setSelectedOrder(fetchedOrders[0].id);
        }
      } catch (err) {
        setError("Không thể tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // 🔹 Lấy order hiện tại
  const currentOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrder),
    [orders, selectedOrder]
  );

  // 🔹 Gọi API để lấy order items thật từ DB
  useEffect(() => {
    const fetchOrderItems = async () => {
      if (!selectedOrder) return;
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_BASE}/api/orders/${selectedOrder}/items`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (res.ok) {
          setOrderItems(data.items || []);
        } else {
          setOrderItems([]);
        }
      } catch (err) {
        console.error("❌ Lỗi lấy danh sách items:", err);
        setOrderItems([]);
      }
    };
    fetchOrderItems();
  }, [selectedOrder]);

  // 🔹 Chuẩn hoá dữ liệu order cho UI
  const mapOrderData = (order: any) => ({
    id: order.id,
    orderNumber: `#${order.id}`,
    status: (order.status || "").toLowerCase(),
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "—",
    total: `₫ ${Number(order.totalPrice || 0).toLocaleString("vi-VN")}`,
    items: orderItems.length || 0, // 🟢 hiển thị số lượng items thực
    estimatedDelivery: order.scheduledTime || "Chưa có thời gian",
    currentLocation:
      (order.status || "").toLowerCase() === "delivered"
        ? "Đã giao"
        : (order.pickupAddress || "").split(",")[0] || "Hà Nội",
    recipient: "Khách hàng",
    address: order.deliveryAddress,
    phone: order.phone,
    timeline: [
      {
        status: "placed",
        label: "Đơn hàng được tạo",
        time: order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "—",
        completed: true,
      },
      {
        status: "confirmed",
        label: "Đơn hàng được xác nhận",
        time: "Chưa có",
        completed: (order.status || "").toLowerCase() !== "pending",
      },
      {
        status: "processing",
        label: "Đang chuẩn bị hàng",
        time: "Chưa có",
        completed:
          (order.status || "").toLowerCase() !== "pending" &&
          (order.status || "").toLowerCase() !== "in-transit",
      },
      {
        status: "shipped",
        label: "Hàng đã được gửi đi",
        time: "Chưa có",
        completed:
          (order.status || "").toLowerCase() === "in-transit" ||
          (order.status || "").toLowerCase() === "delivered",
      },
      {
        status: "in-transit",
        label: "Đang vận chuyển",
        time: "Chưa có",
        completed:
          (order.status || "").toLowerCase() === "in-transit" ||
          (order.status || "").toLowerCase() === "delivered",
      },
      {
        status: "delivered",
        label: "Đã giao hàng",
        time: order.scheduledTime || "Dự kiến",
        completed: (order.status || "").toLowerCase() === "delivered",
      },
    ],
  });

  const mappedCurrent = currentOrder ? mapOrderData(currentOrder) : null;

  return (
    <div className="min-h-screen bg-background">
      <OrderHeader />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 🔍 Search Section */}
        <div className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Tìm kiếm theo thông tin giao hàng"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <Button className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground">
              Tìm kiếm
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 📋 Orders List */}
          <div className="lg:col-span-1">
            <Card className="p-0 overflow-hidden">
              <div className="bg-primary text-primary-foreground p-4">
                <h2 className="font-semibold text-lg">Đơn hàng của tôi</h2>
              </div>
              <div className="divide-y">
                {loading ? (
                  <p className="p-4 text-center text-muted-foreground">Đang tải...</p>
                ) : error ? (
                  <p className="p-4 text-center text-destructive">{error}</p>
                ) : orders.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">Không có đơn hàng.</p>
                ) : (
                  orders.map((order) => {
                    const m = mapOrderData(order);
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedOrder(m.id)}
                        className={`w-full text-left p-4 transition-colors ${
                          selectedOrder === m.id
                            ? "bg-primary/10 border-l-4 border-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {m.orderNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">{m.date}</p>
                            <p className="text-sm font-medium text-primary mt-1">{m.total}</p>
                          </div>
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              m.status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : m.status === "in-transit"
                                ? "bg-primary/15 text-primary"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {m.status === "delivered" && "Đã giao"}
                            {m.status === "in-transit" && "Đang giao"}
                            {m.status === "processing" && "Chuẩn bị"}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* 📦 Order Details + Feedback/Incident */}
          <div className="lg:col-span-2 space-y-6">
            {mappedCurrent && (
              <>
                <OrderDetails order={mappedCurrent} items={orderItems} />
                <OrderTimeline timeline={mappedCurrent.timeline} />

                {mappedCurrent.status === "delivered" && (
                  <div className="mt-4 space-y-4">
                    <FeedbackForm orderId={mappedCurrent.id} />
                    <IncidentForm orderId={mappedCurrent.id} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
