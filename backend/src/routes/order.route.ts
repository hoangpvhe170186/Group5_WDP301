import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  searchOrder,
  updateOrderStatus,
  createTemporaryOrder,
  addOrderItems,
  cancelOrder,
  deleteOrder, 
  getOrderItemsByOrderId
} from "../controllers/order.controller";

const router = Router();
router.get("/:orderId/items", requireAuth, getOrderItemsByOrderId);
router.post("/temporary", createTemporaryOrder); // tạo đơn tạm
router.post("/items", addOrderItems);            // thêm hàng hóa & xác nhận đơn
router.use(requireAuth);
router.get("/search", searchOrder);
router.post("/", createOrder);
router.get("/myorder", getMyOrders);
router.get("/:id", getOrderById);
router.put("/:id", updateOrderStatus);
router.patch("/:id/cancel", requireAuth, cancelOrder); // hủy đơn hàng
router.delete("/:id", deleteOrder); //  đúng cú pháp

export default router;