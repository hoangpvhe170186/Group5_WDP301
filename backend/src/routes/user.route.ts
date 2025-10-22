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
  deleteUser
} from "../controllers/user.controller";
import { get } from "http";
import { requireAuth } from "../middleware/requireAuth";


const router = express.Router();

router.use(requireAuth);
router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderById);
router.put("/orders/:id", updateOrder);
router.get("/drivers", getDrivers);   // ✅ thêm
router.get("/carriers", getCarriers);
router.get("/sellers", getSellers);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/orders/:id/assign", assignOrder);
export default router;
