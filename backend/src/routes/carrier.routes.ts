import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth";
import {
  getMe,
  updateMe,
  getCarrierOrders,
  getCarrierOrderDetail,
  getOrder, // legacy
  acceptOrder,
  declineOrder,
  confirmContract,
  updateOrderProgress,
  confirmDelivery,
  uploadEvidence,
  getEvidence,       // ✅ ADD: controller GET evidence
  reportIncident,
  addTracking,      // ✅ tracking riêng
  getTrackings,
  claimOrder,
  declineAssignedOrder,
  getCarrierProfile,
  acceptAssignedOrder,
  updateCarrierProfile,     // ✅ tracking riêng
  getDebtByOrder,
  createCommissionPayment,
  getCommissionPayments,
} from "../controllers/carrier.controller";
import crypto from "crypto";
import path from "path";
import { withIO } from "../middleware/withIO";
import Order from "../models/Order";

const router = Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // ✅ Lấy đuôi file gốc (.jpg / .png / .mp4)
    const randomName = crypto.randomBytes(16).toString("hex");
    cb(null, randomName + ext); // ✅ Lưu file dạng randomname.jpg
  }
});
const upload = multer({ storage });
/* ============================== AUTH GUARD ============================== */
router.use(requireAuth);

/* ============================== PROFILE ============================== */
router.get("/me", getMe);
router.put("/me", updateMe);

/* ============================== ORDERS ============================== */
router.get("/orders", getCarrierOrders); // ?include=all|active
router.get("/orders/:orderId", getCarrierOrderDetail);
router.get("/orders-legacy/:id", getOrder); // old compatibility

/* ============================== ACTIONS ============================== */
router.post("/orders/:orderId/accept", acceptOrder);
router.post("/orders/:orderId/decline", declineOrder);
router.post("/orders/:orderId/confirm-contract", confirmContract);
router.post("/orders/:orderId/progress", updateOrderProgress);
router.post("/orders/:orderId/confirm-delivery", confirmDelivery);


/* ============================== EVIDENCE & INCIDENT ============================== */
router.post("/orders/:orderId/evidence", upload.array("files"), uploadEvidence);
// ✅ ADD: list evidence (BEFORE/AFTER) – luôn 200 với items=[]
router.get("/orders/:orderId/evidence", getEvidence);

router.post("/orders/:orderId/incidents", upload.array("photos"), reportIncident);

/* ============================== TRACKING RIÊNG (KIỂU SHOPEE) ============================== */
// ✅ NEW: Giống bản cũ của bạn - xử lý tracking riêng
router.post("/order-tracking/:orderId", addTracking);
router.get("/order-tracking/:orderId", getTrackings);
router.post("/orders/:id/claim", requireAuth, withIO, claimOrder); // 🟢 Đây là route đúng, nếu bạn đã thêm withIO
router.post("/decline/:id", requireAuth, withIO, declineAssignedOrder);
router.get("/profile", requireAuth, getCarrierProfile);
router.put("/profile", requireAuth, updateCarrierProfile);
router.post("/orders/:id/accept-assigned", requireAuth, withIO, acceptAssignedOrder);
router.post("/orders/:id/decline-assigned", requireAuth, withIO, declineAssignedOrder);
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const carrierId = req.user._id;

    const orders = await Order.find({
      $or: [
        { status: "CONFIRMED" }, // có thể claim
        { status: "ASSIGNED", $or: [{ assignedCarrier: carrierId }, { carrier_id: carrierId }] },
        { status: "ACCEPTED", $or: [{ assignedCarrier: carrierId }, { carrier_id: carrierId }] },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (err) {
    console.error("❌ Lỗi /api/carrier/orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================== PAYMENTS (CARRIER COMMISSION) ============================== */
router.get("/orders/:orderId/debt", getDebtByOrder);
router.post("/orders/:orderId/payment/create", createCommissionPayment);
router.get("/payments", getCommissionPayments);

/* ============================== EXPORT ============================== */
export default router;
