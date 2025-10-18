import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  searchOrder,
  updateOrderStatus,
  createTemporaryOrder,
   addOrderItems ,
  deleteOrder // ✅ phải có dòng này
} from "../controllers/order.controller";

const router = Router();
router.post("/temporary", createTemporaryOrder); // tạo đơn tạm
router.post("/items", addOrderItems);            // thêm hàng hóa & xác nhận đơn
router.use(requireAuth);
router.get("/search", searchOrder);
router.post("/", createOrder);
router.get("/my", getMyOrders);
router.get("/:id", getOrderById);
router.put("/:id", updateOrderStatus);
router.delete("/:id", deleteOrder); // ✅ đúng cú pháp

export default router;