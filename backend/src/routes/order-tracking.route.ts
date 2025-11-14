import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { Role } from "../models/User";
import Order from "../models/Order";
import OrderTracking from "../models/OrderTracking";

const router = Router();

/**
 * ======================================================
 * ✅ POST /api/order-tracking/:orderId
 * Carrier cập nhật tiến độ vận chuyển
 * ======================================================
 */
router.post("/:orderId", requireAuth, requireRole(Role.Carrier), async (req: any, res, next) => {
  try {
    const { status, note = "" } = req.body || {};
    const orderId = req.params.orderId;

    if (!status) {
      return res.status(400).json({ message: "Missing status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const userId = req.user._id || req.user.id;

    // ✅ Chỉ carrier của đơn đó được phép cập nhật
    if (String(order.carrier_id) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // ✅ Ghi nhận tiến độ mới
    const tracking = await OrderTracking.create({
      order_id: order._id,
      carrier_id: userId,
      status,
      note,
    });

    // Danh sách các trạng thái được phép đồng bộ vào Order chính
    const SYNC_STATUS = [
      "ASSIGNED",
      "ACCEPTED",
      "CONFIRMED",
      "ON_THE_WAY",
      "ARRIVED",
      "DELIVERING",
      "DELIVERED",
      "COMPLETED",
      "INCIDENT",
      "PAUSED",
      "NOTE",
    ];

    // ✅ Nếu thuộc nhóm trên → cập nhật Order.status
    if (SYNC_STATUS.includes(status)) {
      order.status = status;
      order.auditLogs = order.auditLogs || [];
      order.auditLogs.push({
        at: new Date(),
        by: String(userId),
        action: `PROGRESS:${status}`,
        note,
      });
      await order.save();
    }

    // ======================================================
    // 🔔 Phát event realtime qua Socket.IO cho các bên liên quan
    // ======================================================
    if (req.io) {
      // 1️⃣ Phát cho tất cả client đang theo dõi order (Customer / Seller)
      const orderRoom = `order:${orderId}`;
      req.io.to(orderRoom).emit("order:updated", {
        orderId,
        status,
        note,
        updatedAt: new Date(),
      });

      // 2️⃣ Phát cho Seller (dashboard đang mở)
      const sellerRoom = `seller:${order.seller_id}`;
      req.io.to(sellerRoom).emit("order:updated", {
        orderId,
        status,
        note,
        updatedAt: new Date(),
      });

      // 3️⃣ (Tùy chọn mở rộng) Phát cho Carrier của đơn
      const carrierRoom = `carrier:${order.carrier_id}`;
      req.io.to(carrierRoom).emit("order:updated", {
        orderId,
        status,
        note,
        updatedAt: new Date(),
      });

      console.log(
        `📡 Emit order:updated → ${orderRoom}, ${sellerRoom}, ${carrierRoom} [${status}]`
      );
    }

    // ✅ Trả về kết quả
    return res.status(201).json({ success: true, tracking });
  } catch (err) {
    console.error("❌ Error saving tracking:", err);
    next(err);
  }
});

/**
 * ======================================================
 * ✅ GET /api/order-tracking/:orderId
 * Lấy toàn bộ lịch sử tracking cho 1 đơn hàng (Carrier hoặc Seller)
 * ======================================================
 */
router.get(
  "/:orderId",
  requireAuth,
  requireRole(Role.Admin, Role.Seller, Role.Customer, Role.Carrier),
  async (req: any, res, next) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const userId = req.user._id || req.user.id;

    // ✅ Cho phép cả Carrier và Seller xem tracking
    const isCarrier = String(order.carrier_id) === String(userId);
    const isSeller = String(order.seller_id) === String(userId);
    const isCustomer = String(order.customer_id) === String(userId); 
    if (!isCarrier && !isSeller && !isCustomer) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // ✅ Lấy danh sách track theo thời gian giảm dần
    const trackings = await OrderTracking.find({ order_id: orderId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ trackings });
  } catch (err) {
    console.error("❌ Error fetching tracking:", err);
    next(err);
  }
  }
);

export default router;
