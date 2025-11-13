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
  getPaginationCarriers,
  getCarrierDetail,
  getCarrierOrders,
  updateStatusCustomer,
  createUser,
  createCarrier,
  createVehicle,
  getAdminOrderDetail,
  getCustomerOrders,
  getFeedbackOverview,
  getFeedbackList,
  updateFeedbackStatus,
  updateIncidentStatusAdmin
} from "../controllers/admin.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();

router.use(requireAuth);

router.get("/dashboard", getDashboardOverview);
router.get("/dashboard/enhanced", getDashboardEnhanced);
router.get("/revenue", getRevenueStats);
router.get("/orders/status", getOrderStatusStats);

router.post("/users", createUser);

router.get("/carriers/pagination", getPaginationCarriers);
router.get("/carriers/performance", getDriverPerformance);
router.get("/carriers/:carrierId", getCarrierDetail);
router.get("/carriers/:carrierId/orders", getCarrierOrders);
router.post("/carriers", createCarrier);

router.post("/vehicles", createVehicle);

router.get("/orders/pagination", getPaginationAllOrders);
router.get("/orders/:id", getAdminOrderDetail);

router.get("/drivers/pagination", getPaginationDrivers);
router.get("/sellers/pagination", getPaginationSellers);
router.get("/customers/pagination", getPaginationCustomers);
router.get("/customers/:customerId/orders", getCustomerOrders);
router.put("/customers/:id/status", updateStatusCustomer);
router.get("/feedback/overview", getFeedbackOverview);
router.get("/feedback", getFeedbackList);
router.patch("/feedback/reviews/:id", updateFeedbackStatus);
router.patch("/feedback/incidents/:id", updateIncidentStatusAdmin);

export default router;
