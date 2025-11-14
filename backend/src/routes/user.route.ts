import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllOrders,
  getOrderById,
  updateOrder,
  assignOrder,
  confirmOrder,
  getDrivers,
  getCarriers,
  getSellers,
  getDriverSchedule,
  getOrdersByCustomer,
  getFeedbackByOrderId,
  RatingOrders,
  reportIncident,
  getIcidentByOrderId,
  getAllIncidents,
  resolveIncident,
  getCompletedAndCancelledOrders,
  claimSellerOrder,
  cancelOrder,
  getCurrentUser,
  getOrderBySeller,
  changePassword
} from "../controllers/user.controller";

import { requireAuth } from "../middleware/requireAuth";
import { withIO } from "../middleware/withIO";
import { requireRole } from "../middleware/requireRole";
import { Role } from "../models/User";

const router = express.Router();

// 🛡 Middleware xác thực
router.use(requireAuth);

router.get("/me", getCurrentUser);

// ---------------------------
// 🔐 ĐỔI MẬT KHẨU
// ---------------------------
router.post("/change-password", changePassword);

// ---------------------------
// 📦 QUẢN LÝ ĐƠN HÀNG
// ---------------------------
router.get("/orders/history", requireRole(Role.Admin, Role.Seller), getCompletedAndCancelledOrders);
router.get("/orders", requireRole(Role.Admin, Role.Seller), getAllOrders);
router.get("/orders/seller",requireRole(Role.Seller),getOrderBySeller);
router.get("/orders/:id", requireRole(Role.Admin, Role.Seller,Role.Customer), getOrderById);
router.get("/orders/customer/:customer_id", requireRole(Role.Admin, Role.Customer), getOrdersByCustomer);
router.put("/orders/:id", requireRole(Role.Admin), updateOrder);
router.post("/orders/:id/assign", requireRole(Role.Admin), assignOrder);
router.post("/orders/:id/confirm", requireRole(Role.Admin, Role.Seller), confirmOrder);

// ---------------------------
//  DRIVER
// ---------------------------
router.get("/carriers", requireRole(Role.Admin, Role.Seller), getDrivers);
router.get("/carriers/schedule", requireRole(Role.Admin, Role.Seller), getDriverSchedule);


// ---------------------------
// SELLER
// ---------------------------
router.get("/sellers", requireRole(Role.Admin), getSellers);
router.post("/orders/:id/claim-seller", requireRole(Role.Seller), withIO, claimSellerOrder);

// ---------------------------
//  USER
// ---------------------------

router.get("/", requireRole(Role.Admin), getAllUsers);
router.put("/:id", requireRole(Role.Admin), updateUser);
router.delete("/:id", requireRole(Role.Admin), deleteUser);
router.post("/orders/:id/assign", requireRole(Role.Admin), assignOrder);
router.get("/carriers/schedule", requireRole(Role.Admin, Role.Seller), getDriverSchedule);
router.post("/orders/:id/confirm", requireRole(Role.Admin, Role.Seller), confirmOrder);
router.post("/orders/:id/cancel", requireRole(Role.Admin, Role.Seller), cancelOrder);
router.get("/feedback/order/:order_id", requireRole(Role.Admin, Role.Seller, Role.Customer), getFeedbackByOrderId);
router.post("/feedbacks", requireRole(Role.Customer), RatingOrders);
router.post("/incidents/report", requireRole(Role.Customer), reportIncident);
router.get("/incidents/order/:order_id", requireRole(Role.Admin, Role.Seller, Role.Customer), getIcidentByOrderId);
router.get("/incidents", requireRole(Role.Admin, Role.Seller), getAllIncidents);
router.patch("/incidents/:id/resolve", requireRole(Role.Admin, Role.Seller), resolveIncident);
router.get("/:id", requireRole(Role.Admin,Role.Customer,Role.Seller), getUserById);
export default router;
