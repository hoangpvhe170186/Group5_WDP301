import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  loadOrderOrThrow,
  assertCarrierAccess,
  assertUpdatable,
  assertTransition,
} from "../modules/carrier/order-helpers";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import OrderTracking from "../models/OrderTracking";

const router = Router();

// Helper: Decimal128 -> number, & normalize item
const toPlainItem = (it: any) => ({
  id: String(it._id),
  description: it.description ?? "",
  quantity: Number(it.quantity ?? 0),
  weight: it?.weight?.$numberDecimal
    ? Number(it.weight.$numberDecimal)
    : typeof it?.weight === "object" && it?.weight?._bsontype === "Decimal128"
    ? Number(it.weight.toString())
    : Number(it?.weight ?? 0),
  fragile: !!it.fragile,
});

// GET /api/carrier/orders?include=all | active
router.get("/orders", requireAuth, async (req: any, res, next) => {
  try {
    const carrierId = req.user.id || req.user._id;
    const include = String(req.query.include || "active");
    const filter: any = { carrier_id: carrierId };

    if (include !== "all") {
      filter.status = { $nin: ["DECLINED", "CANCELLED"] };
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

    res.json({ orders });
  } catch (err) {
    console.error("❌ Error while fetching carrier orders:", err);
    next(err);
  }
});

// GET /api/carrier/orders/:id  (trả về goods + trackings đã convert)
router.get("/orders/:id", requireAuth, async (req: any, res, next) => {
  try {
    const order = await loadOrderOrThrow(req.params.id);
    assertCarrierAccess(order, req.user.id);

    const [items, trackings] = await Promise.all([
      OrderItem.find({ order_id: order._id }).lean(),
      OrderTracking.find({ order_id: order._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const goods = (items || []).map(toPlainItem);

    res.json({
      ...order.toObject(),
      goods,
      trackings,
    });
  } catch (err) {
    console.error("❌ Error fetching order details:", err);
    next(err);
  }
});

// POST /api/carrier/orders/:id/accept
router.post("/orders/:id/accept", requireAuth, async (req: any, res, next) => {
  try {
    const order = await loadOrderOrThrow(req.params.id);
    assertCarrierAccess(order, req.user.id);

    if (["DECLINED", "CANCELLED", "COMPLETED"].includes(order.status)) {
      return res.status(400).json({ message: "Đơn không thể chấp nhận" });
    }

    order.status = "ACCEPTED";
    order.auditLogs?.push({ at: new Date(), by: req.user.id, action: "ACCEPTED" });
    await order.save();

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/carrier/orders/:id/decline
router.post("/orders/:id/decline", requireAuth, async (req: any, res, next) => {
  try {
    const { reason } = req.body || {};
    const order = await loadOrderOrThrow(req.params.id);
    assertCarrierAccess(order, req.user.id);

    if (["CONFIRMED", "ON_THE_WAY", "ARRIVED", "DELIVERING", "DELIVERED", "COMPLETED"].includes(order.status)) {
      return res.status(400).json({ message: "Không thể từ chối khi đơn đã triển khai" });
    }

    order.status = "DECLINED";
    order.declineReason = reason || null;
    order.auditLogs?.push({ at: new Date(), by: req.user.id, action: "DECLINED", note: reason || "" });
    await order.save();

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/carrier/orders/:id/progress
router.post("/orders/:id/progress", requireAuth, async (req: any, res, next) => {
  try {
    const { status: nextStatus, note = "" } = req.body || {};
    const order = await loadOrderOrThrow(req.params.id);

    assertCarrierAccess(order, req.user.id);
    assertUpdatable(order);
    assertTransition(order.status, nextStatus);

    order.status = nextStatus;
    order.auditLogs?.push({ at: new Date(), by: req.user.id, action: `PROGRESS:${nextStatus}`, note });
    await order.save();

    // cũng lưu vào OrderTracking để đồng bộ lịch sử
    await OrderTracking.create({
      order_id: order._id,
      carrier_id: req.user._id,
      status: nextStatus,
      note,
    });

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/carrier/orders/:id/confirm-delivery
router.post("/orders/:id/confirm-delivery", requireAuth, async (req: any, res, next) => {
  try {
    const { signatureUrl } = req.body || {};
    const order = await loadOrderOrThrow(req.params.id);

    assertCarrierAccess(order, req.user.id);
    assertUpdatable(order);

    order.status = "COMPLETED";
    if (signatureUrl) order.signatureUrl = signatureUrl;
    order.auditLogs?.push({ at: new Date(), by: req.user.id, action: "COMPLETED" });
    await order.save();

    await OrderTracking.create({
      order_id: order._id,
      carrier_id: req.user._id,
      status: "COMPLETED",
      note: "Xác nhận hoàn tất giao hàng",
    });

    res.json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
