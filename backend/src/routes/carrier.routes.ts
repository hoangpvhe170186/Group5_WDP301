import { Router } from "express";
import multer from "multer";
import {
  getMe,
  updateMe,
  getCarrierOrders,
  getCarrierOrderDetail,
  acceptOrder,
  declineOrder,
  confirmContract,
  updateOrderProgress,
  confirmDelivery,
  uploadEvidence,
  reportIncident,
  getOrder, // legacy
} from "../controllers/carrier.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();
const upload = multer({ dest: "tmp/" });

router.use(requireAuth);

// ✅ Profile
router.get("/me", getMe);
router.put("/me", updateMe);

// ✅ Orders
router.get("/orders", getCarrierOrders); // ?include=all|active
router.get("/orders/:orderId", getCarrierOrderDetail);
router.get("/orders-legacy/:id", getOrder); // legacy only

// ✅ Actions
router.post("/orders/:orderId/accept", acceptOrder);
router.post("/orders/:orderId/decline", declineOrder);
router.post("/orders/:orderId/confirm-contract", confirmContract);
router.post("/orders/:orderId/progress", updateOrderProgress);
router.post("/orders/:orderId/confirm-delivery", confirmDelivery);

// ✅ Evidence & Incident
router.post("/orders/:orderId/evidence", upload.array("files"), uploadEvidence);
router.post("/orders/:orderId/incidents", upload.array("photos"), reportIncident);

export default router;
