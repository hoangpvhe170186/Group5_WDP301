import { Router } from "express";
import multer from "multer";
import {
  acceptOrder,
  confirmContract,
  confirmDelivery,
  declineOrder,
  getCarrierOrderDetail,
  getCarrierOrders,
  getMe,
  getOrder,
  listOrders,
  reportIncident,
  updateMe,
  updateOrderProgress,
  updateProgress,
  uploadEvidence,
} from "../controllers/carrier.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();
const upload = multer({ dest: "tmp/" });

router.use(requireAuth);

router.get("/me", getMe);
router.put("/me", updateMe);
router.get("/orders", getCarrierOrders);
router.get("/orders/:orderId", getCarrierOrderDetail);
router.post("/orders/:orderId/accept", acceptOrder);
router.post("/orders/:orderId/progress", updateOrderProgress);
router.get("/orders", listOrders);
router.get("/orders/:id", getOrder);
router.post("/orders/:id/accept", acceptOrder);
router.post("/orders/:id/decline", declineOrder);
router.post("/orders/:id/confirm-contract", confirmContract);
router.post("/orders/:id/progress", updateProgress);
router.post("/orders/:id/evidence", upload.array("files"), uploadEvidence);
router.post("/orders/:id/incidents", upload.array("photos"), reportIncident);
router.post("/orders/:id/confirm-delivery", confirmDelivery);

export default router;
