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
  confirmOrder
} from "../controllers/user.controller";
import { get } from "http";

const router = express.Router();
router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderById);
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
export default router;
