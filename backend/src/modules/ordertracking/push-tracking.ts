import OrderTracking from "../../models/OrderTracking";
import Order from "../../models/Order";

type PushTrackingParams = {
  orderId: string;
  status: string;
  message?: string;
  flagged?: boolean;
  by?: string;                   // userId
  meta?: Record<string, any>;
};

/**
 * Tạo 1 tracking log cho order. Không throw nếu order không tồn tại -> tuỳ bạn,
 * ở đây mình sẽ validate để tránh log rác.
 */
export async function pushTracking({
  orderId,
  status,
  message = "",
  flagged = false,
  by,
  meta = {},
}: PushTrackingParams) {
  const o = await Order.findById(orderId).select("_id");
  if (!o) return;

  await OrderTracking.create({
    order_id: orderId,
    status,
    message,
    flagged,
    by,
    meta,
  });
}

/**
 * Helper nhanh: tự sinh message mặc định theo status.
 */
export function defaultMessageForStatus(status: string): string {
  const map: Record<string, string> = {
    ASSIGNED: "Đơn đã được tạo và chờ tài xế xác nhận.",
    ACCEPTED: "Tài xế đã chấp nhận đơn.",
    CONFIRMED: "Hợp đồng đã được xác nhận.",
    ON_THE_WAY: "Tài xế đang di chuyển tới điểm lấy.",
    ARRIVED: "Tài xế đã tới điểm lấy.",
    DELIVERING: "Đang giao hàng.",
    DELIVERED: "Đã bàn giao cho người nhận.",
    COMPLETED: "Giao hàng thành công.",
    DECLINED: "Tài xế đã từ chối đơn.",
    CANCELLED: "Đơn đã bị huỷ.",
    INCIDENT: "Đơn hàng gặp sự cố.",
  };
  return map[status] ?? status;
}
