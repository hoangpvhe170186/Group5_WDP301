// backend/src/routes/order-tracking.route.ts

import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import Order from "../models/Order";
import OrderTracking from "../models/OrderTracking";

const router = Router();

// ✅ Lưu tracking
router.post("/:orderId", requireAuth, async (req: any, res, next) => {
  try {
    const { status, note = "" } = req.body || {};
    const orderId = req.params.orderId;
    if (!status) return res.status(400).json({ message: "Missing status" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const userId = req.user._id || req.user.id;
    if (String(order.carrier_id) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const t = await OrderTracking.create({
      order_id: order._id,
      carrier_id: userId,
      status,
      note,
    });

    

    // ✅ Nếu thuộc trạng thái chính → cập nhật Order
    const MAIN = ["ASSIGNED", "ACCEPTED", "CONFIRMED", "ON_THE_WAY", "ARRIVED", "DELIVERING", "DELIVERED", "COMPLETED"];
    if (MAIN.includes(status)) {
      order.status = status;
      order.auditLogs?.push({
        at: new Date(),
        by: userId,
        action: `PROGRESS:${status}`,
        note,
      });
      await order.save();
    }

    return res.status(201).json({ success: true, tracking: t });
  } catch (err) {
    next(err);
  }
});

// ✅ Lấy danh sách tracking
router.get("/:orderId", requireAuth, async (req: any, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const userId = req.user._id || req.user.id;
    if (String(order.carrier_id) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const trackings = await OrderTracking.find({ order_id: orderId }).sort({ createdAt: -1 }).lean();
    return res.json({ trackings });
  } catch (err) {
    next(err);
  }
});

export default router;
