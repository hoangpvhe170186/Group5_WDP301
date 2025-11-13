import { Request, Response, NextFunction } from "express";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import OrderTracking from "../models/OrderTracking";
import UploadEvidence from "../models/UploadEvidence";
import Incident from "../models/Incident";
import CarrierDebt from "../models/CarrierDebt";
import CommissionPayment from "../models/CommissionPayment";
import { createPaymentLink } from "../services/payos";
import {
  loadOrderOrThrow,
  assertCarrierAccess,
  assertUpdatable,
  assertTransition,
} from "../modules/carrier/order-helpers";
import mongoose from "mongoose";
function oid(id: string) {
  return new mongoose.Types.ObjectId(id);
}
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

// Helper to convert Decimal128/various numeric shapes to number
function decimalToNumber(input: any): number {
  if (input == null) return 0;
  if (typeof input === "number") return input;
  if (typeof input === "string") return Number(input) || 0;
  if (typeof input === "object") {
    const anyInput = input as any;
    if (anyInput.$numberDecimal) return Number(anyInput.$numberDecimal) || 0;
    if (anyInput._bsontype === "Decimal128" && typeof anyInput.toString === "function") {
      return Number(anyInput.toString()) || 0;
    }
  }
  return Number(input) || 0;
}

// controllers/carrier.controller.ts
export const updateCarrierProfile = async (req: Request, res: Response) => {
  try {
    const { fullName, phone, licenseNumber, vehiclePlate, avatarUrl } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    user.full_name = fullName ?? user.full_name;
    user.phone = phone ?? user.phone;
    user.licenseNumber = licenseNumber ?? user.licenseNumber;
    user.vehiclePlate = vehiclePlate ?? user.vehiclePlate;
    if (avatarUrl) user.avatar = avatarUrl; // ✅ thêm dòng này

    await user.save();

    return res.json({
      fullName: user.full_name,
      phone: user.phone,
      licenseNumber: user.licenseNumber,
      vehiclePlate: user.vehiclePlate,
      avatarUrl: user.avatar, // ✅ trả về để FE hiển thị
    });
  } catch (err) {
    console.error("updateCarrierProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



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

import User from "../models/User";

export const getCarrierProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.status(404).json({ message: "Không tìm thấy carrier" });

    res.json({
      fullName: user.full_name,
      phone: user.phone,
      licenseNumber: user.licenseNumber,
      vehiclePlate: user.vehiclePlate,
      avatarUrl: user.avatar,
      verified: user.status === "Active"
    });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Server error" });
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
// GET /carrier/orders?include=all|active
export const getCarrierOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const carrierId = getUserId(req);
    const include = String(req.query.include || "active");

    const filter: any = {
      $or: [
        { assignedCarrier: carrierId }, // ✅ Đơn được seller assign cho carrier này
        { assignedCarrier: null, status: "CONFIRMED" } // ✅ Đơn tự claim được
      ]
    };

    if (include !== "all") {
      filter.status = { $nin: ["DECLINED", "CANCELLED", "COMPLETED"] };
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ orders });
  } catch (err) {
    console.error("❌ Error while fetching carrier orders:", err);
    next(err);
  }
};

export const acceptAssignedOrder = async (req: any, res: Response) => {
  try {
    const carrierId = oid(getUserId(req));
    const orderId = oid(req.params.id);

    const order = await Order.findOne({
      _id: orderId,
      status: "ASSIGNED",
      assignedCarrier: carrierId
    });

    if (!order) return res.status(404).json({ message: "Order not assigned to you or not in ASSIGNED state" });

    order.status = "ACCEPTED";
    order.auditLogs.push({ at: new Date(), by: carrierId, action: "ASSIGN_ACCEPTED" });
    await order.save();

    res.json({ message: "Order accepted successfully", order });
  } catch (err: any) {
    console.error("❌ acceptAssignedOrder:", err);
    res.status(500).json({ message: err.message });
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
// ✅ Carrier nhận đơn (claim)
// ✅ Carrier nhận đơn (claim)
export async function claimOrder(req: Request, res: Response) {
  try {
    const carrierId = oid(String((req as any).user?._id));
    const orderId = oid(String(req.params.id));
    const now = new Date();

    // chỉ nhận đơn còn CONFIRMED và chưa có assignedCarrier
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, status: "CONFIRMED", assignedCarrier: null },
      {
        $set: {
          assignedCarrier: carrierId,
          carrier_id: carrierId, // 🟩 GÁN CARRIER CHÍNH THỨC CHO ĐƠN
          status: "ACCEPTED",
          acceptedAt: now,
        },
      },
      { new: true }
    )
      .populate("seller_id", "_id")
      .populate("assignedCarrier", "_id");

    if (!updated)
      return res
        .status(409)
        .json({ message: "Đơn này đã được người khác nhận hoặc không khả dụng." });

    // 🟩 Ghi log để dễ truy vết sau này
    updated.auditLogs = updated.auditLogs || [];
    updated.auditLogs.push({
      at: new Date(),
      by: carrierId,
      action: "CLAIM_ORDER",
      note: "Carrier đã nhận đơn và được gán làm người vận chuyển chính",
    });
    await updated.save();

    // ✅ Emit socket event nếu có IO
    const io = (req as any).io;
    if (io) {
      io.to("carrier:all").emit("order:claimed", {
        orderId: String(updated._id),
        status: updated.status,
        carrierId: String(updated.assignedCarrier),
      });
    }

    res.json({ message: "Nhận đơn thành công", order: updated });
  } catch (err: any) {
    console.error("❌ Claim order failed:", err);
    res.status(500).json({ message: err.message });
  }
}

// ========== Carrier từ chối đơn assign ==========
// ========== Carrier từ chối đơn assign ==========
export async function declineAssignedOrder(req: Request, res: Response) {
  try {
    const carrierId = oid(String((req as any).user?._id));
    const orderId = oid(String(req.params.id));
    const now = new Date();

    const updated = await Order.findOneAndUpdate(
      { _id: orderId, status: "ASSIGNED", assignedCarrier: carrierId },
      {
        $set: { status: "DECLINED", declinedAt: now },
        $unset: { assignedCarrier: 1 },
      },
      { new: true }
    ).populate("seller_id", "_id");

    if (!updated)
      return res.status(403).json({
        message:
          "Order is not assigned to you or not in 'assign' status to decline",
      });

    const io = (req as any).io;
    if (io) {
      io.to(`seller:${updated.seller_id}`).emit("order:declined", {
        orderId: String(updated._id),
        status: updated.status,
      });
      io.to("carrier:all").emit("order:declined", {
        orderId: String(updated._id),
        status: updated.status,
      });
    }

    res.json({ message: "Order declined", order: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}



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
    order.isPaid = true; // ✅ Tự động đánh dấu đã thanh toán khi hoàn thành
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

    // 🟩 Auto create CarrierDebt (20% commission) if not existing
    try {
      const carrierId = new mongoose.Types.ObjectId(getUserId(req));
      const exists = await CarrierDebt.findOne({ orderId: order._id, carrierId });
      if (!exists) {
        const total = Number(order.total_price || 0);
        const commission = Math.round(total * 0.2);
        await CarrierDebt.create({
          orderId: order._id,
          carrierId,
          orderCode: order.orderCode,
          totalOrderPrice: total,
          commissionAmount: commission,
          debtStatus: "PENDING",
        } as any);
      }
    } catch (e) {
      console.error("Auto create CarrierDebt failed:", e);
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
};

/* ==========================================================================
 * Payments (Carrier commission)
 * =========================================================================*/
export const getDebtByOrder = async (req: any, res: Response) => {
  const orderId = req.params.orderId;
  const userId = getUserId(req);
  let debt = await CarrierDebt.findOne({ orderId, carrierId: userId });

  // Nếu chưa có debt, thử tạo on-demand khi đơn đã COMPLETED
  if (!debt) {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    // Xác thực quyền truy cập
    try { assertCarrierAccess(order as any, userId); } catch {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (String(order.status).toUpperCase() === "COMPLETED") {
      const total = decimalToNumber((order as any).total_price);
      const commission = Math.round(total * 0.2);
      debt = await CarrierDebt.create({
        orderId: order._id,
        carrierId: new mongoose.Types.ObjectId(userId),
        orderCode: order.orderCode,
        totalOrderPrice: total,
        commissionAmount: commission,
        debtStatus: "PENDING",
      } as any);
    }
  }

  if (!debt) return res.status(404).json({ message: "Không có ghi nợ" });

  return res.json({
    debt: {
      id: String(debt._id),
      status: debt.debtStatus,
      commissionAmount: decimalToNumber((debt as any).commissionAmount),
      orderCode: (debt as any).orderCode,
    },
  });
};

// Stub: create payment link (PayOS integration sẽ thêm sau)
export const createCommissionPayment = async (req: any, res: Response) => {
  const orderId = new mongoose.Types.ObjectId(req.params.orderId);
  const userId = new mongoose.Types.ObjectId(getUserId(req));
  const debt = await CarrierDebt.findOne({ orderId, carrierId: userId });
  if (!debt) return res.status(404).json({ message: "Không có ghi nợ" });
  if (debt.debtStatus === "PAID") return res.status(400).json({ message: "Đã thanh toán" });

  const amount = decimalToNumber((debt as any).commissionAmount);
  // Build description and sanitize to ASCII for PayOS compatibility
  let description = `hoa hong ${debt.orderCode}`;
  if (description.length > 120) description = description.slice(0, 120);

  const payment = await CommissionPayment.create({
    debtId: debt._id,
    orderId,
    carrierId: userId,
    orderCode: debt.orderCode,
    amount,
    description,
    status: "PENDING",
  } as any);

  // Tạo link/QR PayOS
  // PayOS yêu cầu orderCode là số nguyên duy nhất → hash đơn giản
  const numericCode = Number(`${Date.now()}${String(payment._id).slice(-4)}`.replace(/\D/g, "").slice(0, 13));
  const payInput = {
    orderCode: Number.isFinite(numericCode) ? numericCode : Date.now(),
    amount: Math.max(1000, Math.round(amount)),
    description,
  } as const;

  if (!Number.isFinite(payInput.amount) || payInput.amount <= 0) {
    console.error("Invalid commission amount", { raw: amount, computed: payInput.amount, debtId: String(debt._id) });
    return res.status(400).json({ message: "Số tiền hoa hồng không hợp lệ" });
  }
  try {
    const created = await createPaymentLink(payInput);
    payment.payosCode = created.paymentLinkId;
    payment.payosOrderCode = payInput.orderCode; // Lưu numericCode để webhook tìm kiếm
    payment.payosLink = created.checkoutUrl;
    payment.qrCode = created.qrCode;
    await payment.save();

    return res.json({
      paymentId: String(payment._id),
      amount,
      description,
      qrCode: payment.qrCode || null,
      payosLink: payment.payosLink || null,
    });
  } catch (err: any) {
    const payload = err?.response?.data || err?.message || err;
    console.error("Create PayOS payment link failed:", { error: payload, input: payInput });
    // Trả thêm ngữ cảnh để debug FE
    return res.status(500).json({ message: "Không thể khởi tạo thanh toán PayOS", error: payload, input: payInput });
  }
};

export const getCommissionPayments = async (req: any, res: Response) => {
  const orderId = req.query.orderId;
  const userId = getUserId(req);
  const list = await CommissionPayment.find({ orderId, carrierId: userId })
    .sort({ createdAt: -1 })
    .lean();
  res.json({
    payments: list.map((p: any) => ({
      id: String(p._id),
      amount: Number(p.amount),
      status: p.status,
      description: p.description,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
    })),
  });
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

    const docs: any[] = await UploadEvidence.find(query).sort({ createdAt: -1 }).lean();

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
