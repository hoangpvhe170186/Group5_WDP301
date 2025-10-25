import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  getAllOrders,
  getDrivers,
  getCarriers,
  getSellers,
  assignOrder,
  getOrderById,
  updateOrder,
  getDriverSchedule,
  confirmOrder,
  getOrdersByCustomer,
  getFeedbackByOrderId,
  RatingOrders,
  reportIncident,
  getIcidentByOrderId
} from "../controllers/user.controller";
import { get } from "http";

const router = express.Router();
router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderById);
router.get("/orders/customer/:customer_id", getOrdersByCustomer);
router.put("/orders/:id", updateOrder);
router.get("/drivers", getDrivers);   // ✅ thêm
router.get("/carriers", getCarriers);
router.get("/sellers", getSellers);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.post("/orders/:id/assign", assignOrder);
router.get("/drivers/schedule", getDriverSchedule);
router.post("/orders/:id/confirm", confirmOrder);
router.get("/feedback/order/:order_id", getFeedbackByOrderId);
router.post("/feedbacks", RatingOrders);
router.post("/incidents/report", reportIncident);
router.get("/incidents/order/:order_id", getIcidentByOrderId);
export default router;
