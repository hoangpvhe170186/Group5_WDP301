import express from "express";
import { getAllExtraFees } from "../controllers/extraFee.controller";

const router = express.Router();

// ✅ Lấy tất cả phụ phí đang hoạt động
router.get("/", getAllExtraFees);

export default router;
