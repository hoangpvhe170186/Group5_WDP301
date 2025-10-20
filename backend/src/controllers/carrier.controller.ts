import { Request, Response, NextFunction } from "express";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import OrderTracking from "../models/OrderTracking";
import UploadEvidence from "../models/UploadEvidence";
import Incident from "../models/Incident";
import {
  loadOrderOrThrow,
  assertCarrierAccess,
  assertUpdatable,
  assertTransition,
} from "../modules/carrier/order-helpers";
import mongoose from "mongoose";

/** Utils */
const getUserId = (req: any) => req?.user?.id || req?.user?._id;

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

/* ============================================================================
 * Profile
 * ==========================================================================*/
export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    res.json({ me: req.user });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    const payload = req.body || {};
    res.json({ message: "Updated (mock)", payload });
  } catch (err) {
    next(err);
  }
};

/* ============================================================================
 * Orders (List & Detail)
 * ==========================================================================*/
// GET /carrier/orders?include=all|active
export const getCarrierOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const carrierId = getUserId(req);
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
};

// GET /carrier/orders/:orderId
export const getCarrierOrderDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const order = await loadOrderOrThrow(req.params.orderId);
    assertCarrierAccess(order, getUserId(req));

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
};

/** Legacy giữ tương thích: GET /carrier/orders-legacy/:id */
export const getOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const order = await loadOrderOrThrow(req.params.id);
    assertCarrierAccess(order, getUserId(req));

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
    next(err);
  }
};
/* ============================================================================
 * Actions (Accept / Decline / Confirm Contract / Progress / Confirm Delivery)
 * ==========================================================================*/

// POST /carrier/orders/:orderId/accept
export const acceptOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const order = await loadOrderOrThrow(req.params.orderId);
    assertCarrierAccess(order, getUserId(req));

    if (["DECLINED", "CANCELLED", "COMPLETED"].includes(order.status)) {
      return res.status(400).json({ message: "Đơn không thể chấp nhận" });
    }

    order.status = "ACCEPTED";
    order.auditLogs = order.auditLogs || [];
    order.auditLogs.push({ at: new Date(), by: getUserId(req), action: "ACCEPTED" });
    await order.save();

    res.json(order);
  } catch (err) {
    next(err);
  }
};

// POST /carrier/orders/:orderId/decline
export const declineOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body || {};
    const order = await loadOrderOrThrow(req.params.orderId);
    assertCarrierAccess(order, getUserId(req));

    if (["CONFIRMED", "ON_THE_WAY", "ARRIVED", "DELIVERING", "DELIVERED", "COMPLETED"].includes(order.status)) {
      return res.status(400).json({ message: "Không thể từ chối khi đơn đã triển khai" });
    }

    order.status = "DECLINED";
    (order as any).declineReason = reason || null;
    order.auditLogs = order.auditLogs || [];
    order.auditLogs.push({ at: new Date(), by: getUserId(req), action: "DECLINED", note: reason || "" });
    await order.save();

    res.json(order);
  } catch (err) {
    next(err);
  }
};

// POST /carrier/orders/:orderId/confirm-contract
export const confirmContract = async (req: any, res: Response, next: NextFunction) => {
  try {
    const order = await loadOrderOrThrow(req.params.orderId);
    assertCarrierAccess(order, getUserId(req));
    assertUpdatable(order);

    const nextStatus = "CONFIRMED";
    assertTransition(order.status, nextStatus);

    order.status = nextStatus;
    order.auditLogs = order.auditLogs || [];
    order.auditLogs.push({ at: new Date(), by: getUserId(req), action: "CONFIRMED" });
    await order.save();

    await OrderTracking.create({
      order_id: order._id,
      carrier_id: getUserId(req),
      status: nextStatus,
      note: "Xác nhận hợp đồng",
    });

    res.json(order);
  } catch (err) {
    next(err);
  }
};

// POST /carrier/orders/:orderId/progress
export const updateOrderProgress = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { status: nextStatus, note = "" } = req.body || {};
    const order = await loadOrderOrThrow(req.params.orderId);

    assertCarrierAccess(order, getUserId(req));
    assertUpdatable(order);
    assertTransition(order.status, nextStatus);

    order.status = nextStatus;
    order.auditLogs = order.auditLogs || [];
    order.auditLogs.push({ at: new Date(), by: getUserId(req), action: `PROGRESS:${nextStatus}`, note });
    await order.save();

    await OrderTracking.create({
      order_id: order._id,
      carrier_id: getUserId(req),
      status: nextStatus,
      note,
    });

    res.json(order);
  } catch (err) {
    next(err);
  }
};

// POST /carrier/orders/:orderId/confirm-delivery
export const confirmDelivery = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { signatureUrl } = req.body || {};
    const order = await loadOrderOrThrow(req.params.orderId);

    assertCarrierAccess(order, getUserId(req));
    assertUpdatable(order);

    order.status = "COMPLETED";
    if (signatureUrl) (order as any).signatureUrl = signatureUrl;

    order.auditLogs = order.auditLogs || [];
    order.auditLogs.push({ at: new Date(), by: getUserId(req), action: "COMPLETED" });
    await order.save();

    await OrderTracking.create({
      order_id: order._id,
      carrier_id: getUserId(req),
      status: "COMPLETED",
      note: "Xác nhận hoàn tất giao hàng",
    });

    res.json(order);
  } catch (err) {
    next(err);
  }
};

/* ============================================================================
 * NEW ✅ Tracking riêng theo kiểu Shopee: /order-tracking/:id
 * ==========================================================================*/

export const addTracking = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { status, note = "" } = req.body || {};
    if (!status) return res.status(400).json({ message: "Missing status" });

    const order = await loadOrderOrThrow(req.params.orderId);
    assertCarrierAccess(order, getUserId(req));

    const tracking = await OrderTracking.create({
      order_id: order._id,
      carrier_id: getUserId(req),
      status,
      note,
      createdAt: new Date(),
    });

    if (status !== "NOTE") {
      order.status = status;
      order.auditLogs = order.auditLogs || [];
      order.auditLogs.push({
        at: new Date(),
        by: getUserId(req),
        action: `TRACK_${status}`,
        note,
      });
      await order.save();
    }

    res.json({ tracking });
  } catch (err) {
    next(err);
  }
};

// GET /order-tracking/:orderId
export const getTrackings = async (req: any, res: Response, next: NextFunction) => {
  try {
    const order = await loadOrderOrThrow(req.params.orderId);
    assertCarrierAccess(order, getUserId(req));

    const trackings = await OrderTracking.find({ order_id: order._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ trackings });
  } catch (err) {
    next(err);
  }
};

/* ============================================================================
 * Evidence & Incident
 * ==========================================================================*/

// POST /carrier/orders/:orderId/evidence  (multer.array('files'))
export const uploadEvidence = async (req: any, res: Response, next: NextFunction) => {
  try {
    const order = await loadOrderOrThrow(req.params.orderId);
    assertCarrierAccess(order, getUserId(req));

    const files = (req.files || []) as Express.Multer.File[];
    const phase = req.body.phase === "AFTER" ? "AFTER" : "BEFORE";
    const userId = new mongoose.Types.ObjectId(getUserId(req));
    const orderObjectId = new mongoose.Types.ObjectId(order._id);

    if (!files.length) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const fs = require("fs");
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

    const created = await UploadEvidence.create({
      orderId: orderObjectId,
      uploadedBy: userId,
      phase,
      files: files.map((f) => ({
        url: `/uploads/${f.filename}`,
        type: f.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE"
      })),
      createdAt: new Date(),
    });

    order.auditLogs = order.auditLogs || [];
    order.auditLogs.push({
      at: new Date(),
      by: userId,
      action: `UPLOAD_EVIDENCE_${phase}`,
      note: `${files.length} file(s)`
    });
    await order.save();

    return res.json({ success: true, data: created });
  } catch (err) {
    console.error("🔥 UploadEvidence ERROR:", err);
    return res.status(500).json({ message: "Upload failed", error: err });
  }
};

// ✅ GET /carrier/orders/:orderId/evidence?phase=BEFORE|AFTER
export const getEvidence = async (req: any, res: Response, next: NextFunction) => {
  try {
    const order = await loadOrderOrThrow(req.params.orderId);
    assertCarrierAccess(order, getUserId(req));

    const phase = (String(req.query.phase || "").toUpperCase() === "AFTER")
      ? "AFTER"
      : (String(req.query.phase || "").toUpperCase() === "BEFORE" ? "BEFORE" : undefined);

    const query: any = { orderId: new mongoose.Types.ObjectId(order._id) };
    if (phase) query.phase = phase;

    const docs = await UploadEvidence.find(query).sort({ createdAt: -1 }).lean();

    // ✅ MAP về đúng format FE mong đợi
    const items = (docs || []).flatMap((d) =>
      (d.files || []).map((f: any, idx: number) => ({
        _id: `${String(d._id)}_${idx}`,   // FE cần _id
        file_url: f.url,                  // FE đọc key này
        thumb_url: f.url,                 // có thể thay = CDN thumb nếu có
        phase: d.phase,
        uploadedAt: d.createdAt,
      }))
    );

    return res.json({ items }); // luôn 200 OK
  } catch (err) {
    console.error("❌ getEvidence error:", err);
    next(err);
  }
};


// POST /carrier/orders/:orderId/incidents  (multer.array('photos'))
export const reportIncident = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { type, description = "" } = req.body || {};
    const order = await loadOrderOrThrow(req.params.orderId);
    assertCarrierAccess(order, getUserId(req));

    const photos = (req.files || []) as Express.Multer.File[];

    const incident = await Incident.create({
      order_id: order._id,
      carrier_id: getUserId(req),
      type: type || "GENERAL",
      description,
      photos: photos.map((p) => ({
        filename: p.originalname,
        path: p.path,
        size: p.size,
        mime: p.mimetype,
      })),
      reported_at: new Date(),
    });

    order.auditLogs = order.auditLogs || [];
    order.auditLogs.push({
      at: new Date(),
      by: getUserId(req),
      action: "REPORT_INCIDENT",
      note: `${type || "GENERAL"} - ${description?.slice(0, 120)}`,
    });
    await order.save();

    res.json({ incident });
  } catch (err) {
    next(err);
  }
};
