// src/routes/admin.routes.ts
import express from "express";
import {
  getDashboardOverview,
  getPaginationAllOrders,
  getPaginationCustomers,
  getPaginationDrivers,
  getPaginationSellers,
  getRevenueStats,
  getOrderStatusStats,
  getDashboardEnhanced,
  getDriverPerformance,
  getAdminOrderDetail
} from "../controllers/admin.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();

// 🔐 Middleware xác thực cho tất cả route admin
router.use(requireAuth);

router.get("/dashboard", getDashboardOverview);

router.get("/revenue", getRevenueStats);

router.get("/orders/pagination", getPaginationAllOrders);
router.get("/orders/:id", getAdminOrderDetail);

router.get("/customers/pagination", getPaginationCustomers);

router.get("/drivers/pagination", getPaginationDrivers);


router.get("/sellers/pagination", getPaginationSellers);

router.get("/orders/status", getOrderStatusStats);

router.get("/dashboard/enhanced", getDashboardEnhanced);

router.get("/drivers/performance", getDriverPerformance);

export default router;
