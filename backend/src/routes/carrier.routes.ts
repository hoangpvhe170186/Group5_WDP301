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
  getTrackings,     // ✅ tracking riêng
} from "../controllers/carrier.controller";
import crypto from "crypto";
import path from "path";

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

/* ============================== EXPORT ============================== */
export default router;
