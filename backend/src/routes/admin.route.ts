import express from "express";
import {
  getDashboardOverview,

  getRevenueStats,
} from "../controllers/admin.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();
router.use(requireAuth);

//  Dashboard tổng quan
router.get("/dashboard", getDashboardOverview);

//  Thống kê doanh thu theo ngày/tháng
router.get("/revenue", getRevenueStats);

export default router;
