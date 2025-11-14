import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { Role } from "../models/User";
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
  getOrderItemsByOrderId,
  updateOrderPackage,
  updateOrderExtraFees,
  addOrderImages,
  getOrdersByCarrier
} from "../controllers/order.controller";

const router = Router();
router.patch(
  "/:id/update-extrafees",
  requireAuth,
  requireRole(Role.Admin, Role.Seller),
  updateOrderExtraFees
);
router.patch(
  "/:id/update-package",
  requireAuth,
  requireRole(Role.Admin, Role.Seller),
  updateOrderPackage
);
router.get(
  "/:orderId/items",
  requireAuth,
  requireRole(Role.Admin, Role.Seller, Role.Customer, Role.Carrier),
  getOrderItemsByOrderId
);
router.post(
  "/temporary",
  requireAuth,
  requireRole(Role.Admin, Role.Seller, Role.Customer),
  createTemporaryOrder
); // tạo đơn tạm
router.post(
  "/items",
  requireAuth,
  requireRole(Role.Admin, Role.Seller, Role.Customer),
  addOrderItems
); // thêm hàng hóa & xác nhận đơn
router.use(requireAuth);
router.get(
  "/search",
  requireRole(Role.Admin, Role.Seller, Role.Customer, Role.Carrier),
  searchOrder
);
router.post("/", requireRole(Role.Customer, Role.Seller), createOrder);
router.get("/myorder", requireRole(Role.Customer), getMyOrders);
router.get(
  "/carrier/:carrierId",
  requireRole(Role.Carrier, Role.Admin),
  getOrdersByCarrier
);
router.get(
  "/:id",
  requireRole(Role.Admin, Role.Seller, Role.Customer, Role.Carrier),
  getOrderById
);
router.put("/:id", requireRole(Role.Admin, Role.Seller), updateOrderStatus);
router.patch(
  "/:id/cancel",
  requireRole(Role.Customer, Role.Seller),
  cancelOrder
); // hủy đơn hàng
router.delete("/:id", requireRole(Role.Admin), deleteOrder); //  đúng cú pháp
router.post(
  "/:id/images",
  requireRole(Role.Admin, Role.Seller, Role.Carrier),
  addOrderImages
);
export default router;
