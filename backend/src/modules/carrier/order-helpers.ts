import { Types } from "mongoose";
import Order from "../../models/Order";

export type CarrierId = string | Types.ObjectId;

// Các trạng thái không cho phép cập nhật
export const BLOCKED_FOR_UPDATE = new Set(["DECLINED", "CANCELLED", "COMPLETED"]);

/**
 * ✅ Kiểm tra quyền truy cập của Carrier với đơn hàng
 * Cho phép carrier xem:
 *  - Đơn được assign cho chính họ
 *  - Đơn chưa có carrier (đang chờ claim)
 */
export function assertCarrierAccess(order: any, carrierId: CarrierId) {
  if (!order) throw new Error("ORDER_NOT_FOUND");

  const assigned = order.assignedCarrier || order.carrier_id;

  // Nếu đơn đã có assignedCarrier khác => chặn
  if (assigned && String(assigned) !== String(carrierId)) {
    const err: any = new Error("FORBIDDEN");
    err.status = 403;
    throw err;
  }

  // Nếu chưa có assignedCarrier => cho phép xem (để claim)
}

/**
 * ✅ Kiểm tra xem đơn có thể cập nhật tiến độ không
 */
export function assertUpdatable(order: any) {
  if (BLOCKED_FOR_UPDATE.has(order.status)) {
    const err: any = new Error("ORDER_NOT_UPDATABLE");
    err.status = 400;
    err.message = "Đơn đã bị từ chối/huỷ/hoàn tất. Không thể cập nhật tiến độ.";
    throw err;
  }
}

/**
 * ✅ Xác định các trạng thái chuyển tiếp hợp lệ
 */
const ALLOWED_NEXT = new Map<string, string[]>([
  ["AVAILABLE", ["ASSIGNED"]],
  ["ASSIGNED", ["ACCEPTED"]],
  ["ACCEPTED", ["CONFIRMED", "ON_THE_WAY"]],
  ["CONFIRMED", ["ON_THE_WAY"]],
  ["ON_THE_WAY", ["ARRIVED", "DELIVERING"]],
  ["ARRIVED", ["DELIVERING"]],
  ["DELIVERING", ["DELIVERED"]],
  ["DELIVERED", ["COMPLETED"]],
]);

export function assertTransition(current: string, next: string) {
  if (current === next) return;
  const allowed = ALLOWED_NEXT.get(current) || [];
  if (!allowed.includes(next)) {
    const err: any = new Error("INVALID_TRANSITION");
    err.status = 400;
    err.message = `Không thể chuyển từ ${current} sang ${next}`;
    throw err;
  }
}

/**
 * ✅ Load Order, nếu không tồn tại thì ném lỗi
 */
export async function loadOrderOrThrow(id: string) {
  const order = await Order.findById(id);
  if (!order) {
    const err: any = new Error("ORDER_NOT_FOUND");
    err.status = 404;
    throw err;
  }
  return order;
}

/**
 * ✅ Dùng cho FE hiển thị các trạng thái tiếp theo hợp lệ
 */
export const NEXT_MAP = new Map<string, string[]>([
  ["AVAILABLE", ["ASSIGNED"]],
  ["ASSIGNED", ["ACCEPTED"]],
  ["ACCEPTED", ["CONFIRMED", "ON_THE_WAY"]],
  ["CONFIRMED", ["ON_THE_WAY"]],
  ["ON_THE_WAY", ["ARRIVED", "DELIVERING"]],
  ["ARRIVED", ["DELIVERING"]],
  ["DELIVERING", ["DELIVERED"]],
  ["DELIVERED", ["COMPLETED"]],
]);

export function allowedNextStatuses(current: string): string[] {
  return NEXT_MAP.get(current) ?? [];
}
