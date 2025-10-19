import { Types } from "mongoose";
import Order from "../../models/Order";

export type CarrierId = string | Types.ObjectId;

export const BLOCKED_FOR_UPDATE = new Set(["DECLINED", "CANCELLED", "COMPLETED"]);

export function assertCarrierAccess(order: any, carrierId: CarrierId) {
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (String(order.carrier_id) !== String(carrierId)) {
    const err: any = new Error("FORBIDDEN");
    err.status = 403;
    throw err;
  }
}

export function assertUpdatable(order: any) {
  if (BLOCKED_FOR_UPDATE.has(order.status)) {
    const err: any = new Error("ORDER_NOT_UPDATABLE");
    err.status = 400;
    err.message = "Đơn đã bị từ chối/huỷ/hoàn tất. Không thể cập nhật tiến độ.";
    throw err;
  }
}

const ALLOWED_NEXT = new Map<string, string[]>([
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

export async function loadOrderOrThrow(id: string) {
  const order = await Order.findById(id);
  if (!order) {
    const err: any = new Error("ORDER_NOT_FOUND");
    err.status = 404;
    throw err;
  }
  return order;
}

// ✅ Map hỗ trợ FE để render danh sách trạng thái tiếp theo
export const NEXT_MAP = new Map<string, string[]>([
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
