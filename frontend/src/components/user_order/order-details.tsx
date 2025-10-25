import { useState, useMemo } from "react";
import { MapPin, Phone, Calendar, PackageIcon, XCircle, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

// --- Định nghĩa Kiểu dữ liệu ---
interface Order {
    id?: string; // Sẽ dùng _id từ backend
    orderNumber?: string; // Sẽ dùng orderCode từ backend
    status: string;
    date?: string; // Sẽ dùng createdAt từ backend
    total?: string; // Sẽ dùng total_price từ backend
    // items: number; // ❌ Bỏ trường này
    estimatedDelivery?: string; // Sẽ dùng scheduled_time hoặc delivery_schedule
    currentLocation?: string; // Trường này chưa có trong model backend
    recipient?: string; // Sẽ dùng customer_id.fullName từ populate
    address?: string; // Sẽ dùng delivery_address
    phone: string;
    // Thêm các trường khác từ backend nếu cần
    _id?: string;
    orderCode?: string;
    createdAt?: string;
    total_price?: number;
    delivery_schedule?: { type: string; datetime: string | null };
    scheduled_time?: string | null;
    customer_id?: { fullName?: string };
    pickup_address?: string;
    delivery_address?: string; // Thêm nếu cần hiển thị
}

interface OrderItem {
    _id: string;
    description: string;
    quantity: number; // Bắt buộc phải là number
    weight?: number | { $numberDecimal: string };
    fragile?: boolean;
}

interface OrderDetailsProps {
    order: Order | null; // Cho phép order có thể là null ban đầu
    items: OrderItem[] | null; // Cho phép items có thể là null ban đầu
}

// --- Component ---
export default function OrderDetails({ order, items }: OrderDetailsProps) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

    // ✅ Tính tổng số lượng sản phẩm an toàn hơn
    const totalQuantity = useMemo(() => {
        // 1. Kiểm tra nếu items không phải là mảng hoặc rỗng
        if (!Array.isArray(items) || items.length === 0) {
            return 0;
        }
        // 2. Reduce và kiểm tra từng item
        return items.reduce((sum, item) => {
            // Chỉ cộng nếu item.quantity là một số hợp lệ
            const quantity = Number(item?.quantity); // Cố gắng chuyển thành số
            return sum + (isNaN(quantity) ? 0 : quantity); // Nếu không phải số thì cộng 0
        }, 0);
    }, [items]); // Chỉ tính lại khi mảng items thay đổi

    const handleCancelOrder = async () => {
        if (!order) return; // Kiểm tra order tồn tại

        const orderIdToCancel = order._id || order.id;
        if (!orderIdToCancel) {
            alert("Không tìm thấy ID đơn hàng để hủy.");
            return;
        }

        if (order.status.toLowerCase() !== "pending") {
            alert("Chỉ có thể hủy đơn hàng đang ở trạng thái 'Pending'.");
            return;
        }
        const confirmCancel = window.confirm("Bạn có chắc muốn hủy đơn hàng này không?");
        if (!confirmCancel) return;

        try {
            setLoading(true);
            setMessage(null);
            const token = localStorage.getItem("auth_token");

            const res = await fetch(`${API_BASE}/api/orders/${orderIdToCancel}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (res.ok && data.success !== false) {
                setMessage("Đơn hàng đã được hủy thành công.");
                // Cân nhắc gọi callback để refresh list: props.onOrderCancelled?.(orderIdToCancel);
            } else {
                setMessage(` ${data.message || "Không thể hủy đơn hàng."}`);
            }
        } catch (err) {
            console.error("Lỗi hủy đơn:", err);
            setMessage(" Lỗi khi kết nối tới máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    // --- Lấy thông tin hiển thị an toàn ---
    const displayOrderId = order?._id || order?.id || 'N/A';
    const displayOrderCode = order?.orderCode || order?.orderNumber || 'N/A';
    const displayStatus = order?.status || 'N/A';
    const displayTotal = order?.total_price !== undefined ? order.total_price.toLocaleString('vi-VN') + 'đ' : order?.total || 'N/A';
    const displayRecipient = order?.customer_id?.fullName || order?.recipient || 'Không có tên';
    const displayAddress = order?.delivery_address || order?.address || 'Không có địa chỉ'; // Ưu tiên delivery_address
    const displayPhone = order?.phone || 'Không có SĐT';
    const displayEstimatedDelivery = order?.scheduled_time ? new Date(order.scheduled_time).toLocaleString('vi-VN')
                                : order?.delivery_schedule?.datetime ? new Date(order.delivery_schedule.datetime).toLocaleString('vi-VN')
                                : order?.estimatedDelivery || 'Chưa xác định';

    if (!order) {
        return <Card className="p-6 text-center text-gray-500">Đang tải thông tin đơn hàng...</Card>;
    }


    return (
        <div className="space-y-4">
            {/* Thông tin trạng thái */}
            <Card className="p-6 bg-gradient-to-r from-orange-500/10 to-orange-500/5 border-orange-500/30">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Trạng thái đơn hàng</p>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{displayOrderCode}</h3>
                        <p className="text-orange-600 font-semibold">
                            {displayStatus.toLowerCase() === "pending" && "⏳ Chờ xử lý"}
                            {displayStatus.toLowerCase() === "confirmed" && "✅ Đã xác nhận"}
                            {displayStatus.toLowerCase() === "on_the_way" && "🚚 Đang vận chuyển"}
                            {displayStatus.toLowerCase() === "delivered" && "📦 Đã giao hàng"}
                            {displayStatus.toLowerCase() === "completed" && "💯 Hoàn thành"}
                            {displayStatus.toLowerCase() === "canceled" && "❌ Đã hủy"}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Tổng tiền</p>
                        <p className="text-2xl font-bold text-orange-600">{displayTotal}</p>
                    </div>
                </div>

                {/* Nút Hủy Đơn */}
                <button
                    onClick={handleCancelOrder}
                    disabled={loading || displayStatus.toLowerCase() !== 'pending'}
                    className={`mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold shadow-sm transition
                        ${
                        displayStatus.toLowerCase() === 'pending'
                            ? "bg-red-600 hover:bg-red-700 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    {displayStatus.toLowerCase() === 'pending' ? (
                        <>
                            <XCircle className="w-4 h-4" />
                            {loading ? "Đang hủy..." : "Hủy đơn"}
                        </>
                    ) : (
                        <>
                            <Lock className="w-4 h-4" />
                            Không thể hủy
                        </>
                    )}
                </button>
                {message && <p className={`mt-2 text-sm ${message.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
            </Card>

            {/* Thông tin giao hàng */}
            <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Thông tin giao hàng</h3>
                <div className="space-y-4">
                    <div className="flex gap-3 items-start">
                        <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                        <div>
                            <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
                            <p className="font-medium text-gray-800">{displayRecipient}</p>
                            <p className="text-sm text-gray-700">{displayAddress}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                        <Phone className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                        <div>
                            <p className="text-sm text-gray-500">Số điện thoại</p>
                            <p className="font-medium text-gray-800">{displayPhone}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                        <Calendar className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                        <div>
                            <p className="text-sm text-gray-500">Thời gian giao</p>
                            <p className="font-medium text-gray-800">{displayEstimatedDelivery}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                        <PackageIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                        <div>
                            <p className="text-sm text-gray-500">Số lượng sản phẩm</p>
                            {/* ✅ Hiển thị tổng số lượng đã tính */}
                            <p className="font-medium text-gray-800">{totalQuantity} sản phẩm</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

