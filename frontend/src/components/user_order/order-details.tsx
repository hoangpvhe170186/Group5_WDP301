"use client"

import { useEffect, useState } from "react"
import { MapPin, Phone, Calendar, PackageIcon, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { orderApi, type Order } from "@/services/order.service"
import { toast } from "sonner"

interface OrderDetailsProps {
  id: string
}

export default function OrderDetails({ id }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderApi.getDetail(id)
        setOrder(data)
      } catch (error: any) {
        toast.error(error.message || "Không thể tải chi tiết đơn hàng")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchOrder()
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <p>Đang tải chi tiết đơn hàng...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center text-muted-foreground py-16">
        Không tìm thấy đơn hàng.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Trạng thái đơn hàng</p>
            <h3 className="text-2xl font-bold text-foreground mb-2">{order.orderNumber}</h3>
            <p className="text-primary font-semibold">
              {order.status === "delivered" && "✓ Đã giao hàng"}
              {order.status === "in-transit" && "🚚 Đang vận chuyển"}
              {order.status === "processing" && "📦 Đang chuẩn bị"}
              {order.status === "confirmed" && "✅ Đã xác nhận"}
              {order.status === "pending" && "🕓 Đang chờ xử lý"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tổng tiền</p>
            <p className="text-2xl font-bold text-primary">{order.data.total_price}</p>
          </div>
        </div>
      </Card>

      {/* Delivery Info */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 text-foreground">Thông tin giao hàng</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Địa chỉ giao hàng</p>
              <p className="font-medium text-foreground">{order.recipient}</p>
              <p className="text-sm text-foreground">{order.address}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Số điện thoại</p>
              <p className="font-medium text-foreground">{order.phone}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Dự kiến giao</p>
              <p className="font-medium text-foreground">{order.estimatedDelivery}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <PackageIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Số lượng sản phẩm</p>
              <p className="font-medium text-foreground">{order.items} sản phẩm</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
