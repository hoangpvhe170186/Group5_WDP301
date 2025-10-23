import { useState } from "react";
import { MapPin, Phone, Calendar, PackageIcon, XCircle, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  date: string;
  total: string;
  items: number;
  estimatedDelivery: string;
  currentLocation: string;
  recipient: string;
  address: string;
  phone: string;
}

export default function OrderDetails({ order }: { order: Order }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  // ✅ Hàm xử lý hủy đơn hàng
  const handleCancelOrder = async () => {
    if (order.status.toLowerCase() !== "pending") {
      alert("❌ Chỉ có thể hủy đơn hàng đang ở trạng thái 'Pending'.");
      return;
    }

    const confirmCancel = window.confirm("Bạn có chắc muốn hủy đơn hàng này không?");
    if (!confirmCancel) return;

    try {
      setLoading(true);
      setMessage(null);

      const token = localStorage.getItem("auth_token");

      const res = await fetch(`${API_BASE}/api/orders/${order.id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: "Khách đổi ý, muốn hủy đơn hàng.",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Đơn hàng đã được hủy và xóa thành công.");
      } else {
        setMessage(`❌ ${data.message || "Không thể hủy đơn hàng."}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Lỗi khi kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 🧾 Thông tin trạng thái đơn hàng */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Trạng thái đơn hàng</p>
            <h3 className="text-2xl font-bold text-foreground mb-2">{order.orderNumber}</h3>
            <p className="text-primary font-semibold">
              {order.status === "Pending" && "⏳ Chờ xử lý"}
              {order.status === "processing" && "📦 Đang chuẩn bị"}
              {order.status === "in-transit" && "🚚 Đang vận chuyển"}
              {order.status === "delivered" && "✅ Đã giao hàng"}
              {order.status === "Canceled" && "❌ Đã hủy đơn hàng"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tổng tiền</p>
            <p className="text-2xl font-bold text-primary">{order.total}</p>
          </div>
        </div>

        {/* 🔘 Nút Hủy Đơn (luôn hiển thị, chỉ cho phép nếu Pending) */}
        <button
          onClick={handleCancelOrder}
          disabled={loading}
          className={`mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold shadow transition
            ${
              order.status.toLowerCase() === "pending"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
        >
          {order.status.toLowerCase() === "pending" ? (
            <>
              <XCircle className="w-5 h-5" />
              {loading ? "Đang hủy..." : "Hủy đơn hàng"}
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Không thể hủy
            </>
          )}
        </button>

        {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
      </Card>

      {/* 🚚 Thông tin giao hàng */}
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
  );
}
