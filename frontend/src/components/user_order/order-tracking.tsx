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
import { socket } from "@/lib/socket";

// 🧩 Hàm chuyển trạng thái sang tiếng Việt
function convertStatusToLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: "Đơn hàng được tạo",
    CONFIRMED: "Đã xác nhận đơn",
    AVAILABLE: "Sẵn sàng giao",
    ASSIGNED: "Đã phân công tài xế",
    ACCEPTED: "Tài xế đã nhận đơn",
    ON_THE_WAY: "Tài xế đang di chuyển",
    ARRIVED: "Tài xế đã đến nơi",
    DELIVERING: "Đang giao hàng",
    DELIVERED: "Đã giao hàng",
    COMPLETED: "Hoàn tất đơn hàng",
    INCIDENT: "Phát sinh sự cố",
    PAUSED: "Tạm dừng xử lý",
    DECLINED: "Từ chối nhận đơn",
    CANCELLED: "Đã hủy đơn",
    NOTE: "Ghi chú thêm",
  };
  return map[status] || status;
}

export default function OrderTracking() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  // ============================================================
  // 🔹 1️⃣ Lấy danh sách đơn hàng của customer
  // ============================================================
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

  // ============================================================
  // 🔹 2️⃣ Xác định đơn hàng hiện tại
  // ============================================================
  const currentOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrder),
    [orders, selectedOrder]
  );

  // ============================================================
  // 🔹 3️⃣ Lấy danh sách items trong đơn hàng
  // ============================================================
  useEffect(() => {
    if (!selectedOrder) return;
    const fetchOrderItems = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_BASE}/api/orders/${selectedOrder}/items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOrderItems(data.items || []);
      } catch (err) {
        console.error("❌ Lỗi lấy danh sách items:", err);
        setOrderItems([]);
      }
    };
    fetchOrderItems();
  }, [selectedOrder]);

  // ============================================================
  // 🔹 4️⃣ Lấy danh sách tracking theo orderId
  // ============================================================
  const fetchTracking = async (orderId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/order-tracking/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTracking(data.trackings || []);
      } else {
        console.warn("⚠️ Không thể lấy tracking:", data);
        setTracking([]);
      }
    } catch (err) {
      console.error("❌ Lỗi lấy tracking:", err);
      setTracking([]);
    }
  };

  // Lần đầu load hoặc đổi đơn → fetch tracking
  useEffect(() => {
    if (selectedOrder) {
      fetchTracking(selectedOrder);
    }
  }, [selectedOrder]);

  // ============================================================
  // 🔹 5️⃣ Lắng nghe realtime qua Socket.IO
  // ============================================================
  useEffect(() => {
    if (!selectedOrder) return;

    const room = `order:${selectedOrder}`;
    socket.emit("join_room", room);
    console.log("👀 Customer joined:", room);

    socket.on("order:updated", (data) => {
      if (data.orderId === selectedOrder) {
        console.log("📦 Received order update:", data);
        fetchTracking(selectedOrder);
      }
    });

    return () => {
      socket.off("order:updated");
      socket.emit("leave_room", room);
    };
  }, [selectedOrder]);

  // ============================================================
  // 🔹 6️⃣ Chuẩn hoá order cho UI hiển thị
  // ============================================================
  const mapOrderData = (order: any) => ({
    id: order.id,
    orderNumber: `#${order.id}`,
    status: (order.status || "").toLowerCase(),
    date: order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("vi-VN")
      : "—",
    total: `₫ ${Number(order.totalPrice || 0).toLocaleString("vi-VN")}`,
    items: orderItems.length || 0,
    estimatedDelivery: order.scheduledTime || "Chưa có thời gian",
    currentLocation:
      (order.status || "").toLowerCase() === "delivered"
        ? "Đã giao"
        : (order.pickupAddress || "").split(",")[0] || "Hà Nội",
    recipient: "Khách hàng",
    address: order.deliveryAddress,
    phone: order.phone,
  });

  const mappedCurrent = currentOrder ? mapOrderData(currentOrder) : null;

  // ============================================================
  // 🔹 7️⃣ Chuẩn hoá timeline tracking cho hiển thị
  // ============================================================
  const timeline = tracking.map((t) => ({
    status: t.status,
    label: convertStatusToLabel(t.status),
    time: new Date(t.createdAt).toLocaleString("vi-VN"),
    completed: true,
  }));

  // ============================================================
  // 🔹 8️⃣ Render giao diện
  // ============================================================
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
          {/* 📋 Danh sách đơn hàng */}
          <div className="lg:col-span-1">
            <Card className="p-0 overflow-hidden">
              <div className="bg-primary text-primary-foreground p-4">
                <h2 className="font-semibold text-lg">Đơn hàng của tôi</h2>
              </div>
              <div className="divide-y">
                {loading ? (
                  <p className="p-4 text-center text-muted-foreground">
                    Đang tải...
                  </p>
                ) : error ? (
                  <p className="p-4 text-center text-destructive">{error}</p>
                ) : orders.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">
                    Không có đơn hàng.
                  </p>
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
                            <p className="text-sm text-muted-foreground">
                              {m.date}
                            </p>
                            <p className="text-sm font-medium text-primary mt-1">
                              {m.total}
                            </p>
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

          {/* 📦 Chi tiết + timeline + feedback */}
          <div className="lg:col-span-2 space-y-6">
            {mappedCurrent && (
              <>
                <OrderDetails order={mappedCurrent} items={orderItems} />
                <OrderTimeline timeline={timeline} />

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
