"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import OrderTimeline from "./order-timeline"
import OrderDetails from "./order-details"
import OrderHeader from "./order-header"
import { orderApi } from "@/services/order.service"

export default function OrderTracking() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const { orders: fetchedOrders } = await orderApi.listMyOrders()
        console.log(fetchedOrders)
        setOrders(fetchedOrders)
        if (fetchedOrders.length > 0) {
          setSelectedOrder(fetchedOrders[0].id)
        }
      } catch (err) {
        setError("Không thể tải danh sách đơn hàng")
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const currentOrder = orders.find((o) => o.id === selectedOrder)
          
  // Ánh xạ dữ liệu từ API sang định dạng phù hợp với component
  const mapOrderData = (order: any) => ({
    id: order.id,
    orderNumber: `#${order.id}`, // Điều chỉnh theo nhu cầu, có thể dùng _id từ backend
    status: order.status.toLowerCase(),
    date: new Date(order.createdAt).toLocaleDateString("vi-VN"),
    total: `₫ ${order.totalPrice.toLocaleString("vi-VN")}`,
    items: 1, 
    estimatedDelivery: order.scheduledTime || "Chưa có thời gian",
    currentLocation: order.status === "delivered" ? "Đã giao" : order.pickupAddress.split(",")[0] || "Hà Nội",
    recipient: "Khách hàng", // Cần thêm trường từ backend nếu có (ví dụ: customer_id)
    address: order.deliveryAddress,
    phone: order.phone, // Cần thêm trường từ backend nếu có (ví dụ: phone)
    timeline: [
      { status: "placed", label: "Đơn hàng được tạo", time: new Date(order.createdAt).toLocaleString("vi-VN"), completed: true },
      { status: "confirmed", label: "Đơn hàng được xác nhận", time: "Chưa có", completed: order.status !== "Pending" },
      { status: "processing", label: "Đang chuẩn bị hàng", time: "Chưa có", completed: order.status !== "Pending" && order.status !== "in-transit" },
      { status: "shipped", label: "Hàng đã được gửi đi", time: "Chưa có", completed: order.status === "in-transit" || order.status === "delivered" },
      { status: "in-transit", label: "Đang vận chuyển", time: "Chưa có", completed: order.status === "in-transit" || order.status === "delivered" },
      { status: "delivered", label: "Đã giao hàng", time: order.scheduledTime || "Dự kiến", completed: order.status === "delivered" },
    ],
  })

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
                {loading ? (
                  <p className="p-4 text-center text-muted-foreground">Đang tải...</p>
                ) : error ? (
                  <p className="p-4 text-center text-destructive">{error}</p>
                ) : orders.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">Không có đơn hàng.</p>
                ) : (
                  orders.map((order) => {
                    const mappedOrder = mapOrderData(order)
                    return (
                      <button
                        key={mappedOrder.id}
                        onClick={() => setSelectedOrder(mappedOrder.id)}
                        className={`w-full text-left p-4 transition-colors ${
                          selectedOrder === mappedOrder.id ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{mappedOrder.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">{mappedOrder.date}</p>
                            <p className="text-sm font-medium text-primary mt-1">{mappedOrder.total}</p>
                          </div>
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              mappedOrder.status === "delivered"
                                ? "bg-primary/20 text-primary"
                                : mappedOrder.status === "in-transit"
                                  ? "bg-primary/15 text-primary"
                                  : "bg-primary/10 text-primary"
                            }`}
                          >
                            {mappedOrder.status === "delivered" && "Đã giao"}
                            {mappedOrder.status === "in-transit" && "Đang giao"}
                            {mappedOrder.status === "processing" && "Chuẩn bị"}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {currentOrder && (
              <>
                <OrderDetails order={mapOrderData(currentOrder)} />
                <OrderTimeline timeline={mapOrderData(currentOrder).timeline} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}