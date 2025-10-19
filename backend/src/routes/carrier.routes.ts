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

router.get("/me", getMe);
router.put("/me", updateMe);
router.get("/orders", getCarrierOrders);
router.get("/orders/:orderId", getCarrierOrderDetail);
router.get("/orders-legacy/:id", getOrder);
router.post("/orders/:orderId/accept", acceptOrder);
router.post("/orders/:orderId/decline", declineOrder);
router.post("/orders/:orderId/confirm-contract", confirmContract);
router.post("/orders/:orderId/progress", updateOrderProgress);
router.post("/orders/:orderId/confirm-delivery", confirmDelivery);
router.post("/orders/:orderId/evidence", upload.array("files"), uploadEvidence);
router.post("/orders/:orderId/incidents", upload.array("photos"), reportIncident);

export default router;
