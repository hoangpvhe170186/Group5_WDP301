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
  // ✅ các hàm phân trang mới
  getPaginationCustomers,
  getPaginationAllOrders,
  getPaginationDrivers,
  getPaginationSellers,
} from "../controllers/user.controller";

import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();

// 🛡 Middleware xác thực
router.use(requireAuth);

// ---------------------------
// 📦 QUẢN LÝ ĐƠN HÀNG
// ---------------------------
router.get("/orders", getAllOrders);
router.get("/orders/pagination", getPaginationAllOrders); // ✅ thêm route phân trang
router.get("/orders/:id", getOrderById);
router.put("/orders/:id", updateOrder);
router.post("/orders/:id/assign", assignOrder);
router.post("/orders/:id/confirm", confirmOrder);

// ---------------------------
// 🚚 DRIVER
// ---------------------------
router.get("/drivers", getDrivers);
router.get("/drivers/pagination", getPaginationDrivers); // ✅ thêm route phân trang
router.get("/drivers/schedule", getDriverSchedule);


// ---------------------------
// 🏪 SELLER
// ---------------------------
router.get("/sellers", getSellers);
router.get("/sellers/pagination", getPaginationSellers); // ✅ thêm route phân trang


// 👥 CUSTOMER
router.get("/customers/pagination", getPaginationCustomers);

// ---------------------------
// 👤 USER
// ---------------------------

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
