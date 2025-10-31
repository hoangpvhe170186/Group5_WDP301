
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { authorizeRoles } from "../middleware/authorizeRoles";
import { Role } from "../models/User";
import { postCalculate, getOne, getList, getSummary } from "../controllers/sellerSalary.controller";

const router = Router();

router.use(requireAuth, authorizeRoles(Role.Admin)); // chỉ Admin

// Tính/Upsert 1 seller/tháng
router.post("/sellers/:sellerId/salary/calculate", postCalculate);

// Lấy chi tiết lương 1 seller
router.get("/sellers/:sellerId/salary", getOne);

// Danh sách lương nhiều seller (filter + trang)
router.get("/salaries", getList);

// Tổng quan chi phí theo tháng
router.get("/salaries/summary", getSummary);

export default router;
