import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  searchOrder,
  updateOrderStatus,
  deleteOrder // ✅ phải có dòng này
} from "../controllers/order.controller";

const router = Router();

router.use(requireAuth);
router.get("/search", searchOrder);
router.post("/", createOrder);
router.get("/my", getMyOrders);
router.get("/:id", getOrderById);
router.put("/:id", updateOrderStatus);
router.delete("/:id", deleteOrder); // ✅ đúng cú pháp

export default router;