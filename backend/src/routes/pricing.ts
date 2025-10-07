import { Router } from "express";
import { calcPrice, getPricingDetailsByName } from "../controllers/pricing.controller";

const router = Router();

// Route mới để lấy chi tiết 1 gói cước bằng TÊN
router.get("/details/:packageName", getPricingDetailsByName);

// Route cũ để tính giá
router.post("/calc", calcPrice);

export default router;