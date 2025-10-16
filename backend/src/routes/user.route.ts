import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  getAllOrders,
  getDrivers,
  getCarriers,
  assignOrder
} from "../controllers/user.controller";
import { get } from "http";

const router = express.Router();
router.get("/orders", getAllOrders);
router.get("/drivers", getDrivers);   // ✅ thêm
router.get("/carriers", getCarriers);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.post("/orders/:id/assign", assignOrder);
export default router;
