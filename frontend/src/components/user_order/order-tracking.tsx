"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import OrderTimeline from "./order-timeline"
import OrderDetails from "./order-details"
import OrderHeader from "./order-header"

export default function OrderTracking() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<string | null>("ORD-2024-001")

  const orders = [
    {
      id: "ORD-2024-001",
      orderNumber: "#ORD-2024-001",
      status: "in-transit",
      date: "19/10/2024",
      total: "₫ 1,250,000",
      items: 3,
      estimatedDelivery: "20/10/2024",
      currentLocation: "Hà Nội",
      recipient: "Nguyễn Văn A",
      address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
      phone: "0901234567",
      timeline: [
        { status: "placed", label: "Đơn hàng được tạo", time: "18/10/2024 10:30", completed: true },
        { status: "confirmed", label: "Đơn hàng được xác nhận", time: "18/10/2024 11:00", completed: true },
        { status: "processing", label: "Đang chuẩn bị hàng", time: "18/10/2024 14:00", completed: true },
        { status: "shipped", label: "Hàng đã được gửi đi", time: "19/10/2024 08:00", completed: true },
        { status: "in-transit", label: "Đang vận chuyển", time: "19/10/2024 15:30", completed: true },
        { status: "delivered", label: "Đã giao hàng", time: "Dự kiến 20/10/2024", completed: false },
      ],
    },
    {
      id: "ORD-2024-002",
      orderNumber: "#ORD-2024-002",
      status: "delivered",
      date: "15/10/2024",
      total: "₫ 850,000",
      items: 2,
      estimatedDelivery: "17/10/2024",
      currentLocation: "Đã giao",
      recipient: "Trần Thị B",
      address: "456 Đường Nguyễn Huệ, Quận 3, TP.HCM",
      phone: "0912345678",
      timeline: [
        { status: "placed", label: "Đơn hàng được tạo", time: "15/10/2024 09:00", completed: true },
        { status: "confirmed", label: "Đơn hàng được xác nhận", time: "15/10/2024 09:30", completed: true },
        { status: "processing", label: "Đang chuẩn bị hàng", time: "15/10/2024 13:00", completed: true },
        { status: "shipped", label: "Hàng đã được gửi đi", time: "16/10/2024 07:00", completed: true },
        { status: "in-transit", label: "Đang vận chuyển", time: "16/10/2024 14:00", completed: true },
        { status: "delivered", label: "Đã giao hàng", time: "17/10/2024 16:30", completed: true },
      ],
    },
  ]

  const currentOrder = orders.find((o) => o.id === selectedOrder)

  return (
    <div className="min-h-screen bg-background">
      <OrderHeader />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
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
            <Button className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground">Tìm kiếm</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <Card className="p-0 overflow-hidden">
              <div className="bg-primary text-primary-foreground p-4">
                <h2 className="font-semibold text-lg">Đơn hàng của tôi</h2>
              </div>
              <div className="divide-y">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      selectedOrder === order.id ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                        <p className="text-sm font-medium text-primary mt-1">{order.total}</p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          order.status === "delivered"
                            ? "bg-primary/20 text-primary"
                            : order.status === "in-transit"
                              ? "bg-primary/15 text-primary"
                              : "bg-primary/10 text-primary"
                        }`}
                      >
                        {order.status === "delivered" && "Đã giao"}
                        {order.status === "in-transit" && "Đang giao"}
                        {order.status === "processing" && "Chuẩn bị"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {currentOrder && (
              <>
                <OrderDetails order={currentOrder} />
                <OrderTimeline timeline={currentOrder.timeline} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
