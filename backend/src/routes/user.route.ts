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
  confirmOrder,
  getOrdersByCustomer,
  getFeedbackByOrderId,
  RatingOrders,
  reportIncident,
  getIcidentByOrderId,
  getAllIncidents,
  resolveIncident,
  getCompletedAndCancelledOrders,
  claimSellerOrder
} from "../controllers/user.controller";

import { requireAuth } from "../middleware/requireAuth";
import { withIO } from "../middleware/withIO";

const router = express.Router();

// 🛡 Middleware xác thực
router.use(requireAuth);

// ---------------------------
// 📦 QUẢN LÝ ĐƠN HÀNG
// ---------------------------
router.get("/orders/history", getCompletedAndCancelledOrders);
router.get("/orders", getAllOrders);

router.get("/orders/:id", getOrderById);
router.get("/orders/customer/:customer_id", getOrdersByCustomer);
router.put("/orders/:id", updateOrder);
router.post("/orders/:id/assign", assignOrder);
router.post("/orders/:id/confirm", confirmOrder);

// ---------------------------
//  DRIVER
// ---------------------------
router.get("/drivers", getDrivers);
router.get("/drivers/schedule", getDriverSchedule);


// ---------------------------
// SELLER
// ---------------------------
router.get("/sellers", getSellers);
router.post("/orders/:id/claim-seller", requireAuth, withIO, claimSellerOrder);

// ---------------------------
//  USER
// ---------------------------

router.get("/", getAllUsers);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/orders/:id/assign", assignOrder);
router.get("/drivers/schedule", getDriverSchedule);
router.post("/orders/:id/confirm", confirmOrder);
router.get("/feedback/order/:order_id", getFeedbackByOrderId);
router.post("/feedbacks", RatingOrders);
router.post("/incidents/report", reportIncident);
router.get("/incidents/order/:order_id", getIcidentByOrderId);
router.get("/incidents", getAllIncidents);
router.patch("/incidents/:id/resolve", resolveIncident);
router.get("/:id", getUserById);

export default router;
