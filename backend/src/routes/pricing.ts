import { Router } from "express";
import { calcPrice, getPricingDetailsByName , estimatePriceByAddress, estimatePriceByAddress2 ,getAllPricePackages } from "../controllers/pricing.controller";

const router = Router();

// Route mới để lấy chi tiết 1 gói cước bằng TÊN
router.get("/details/:packageName", getPricingDetailsByName);

// Route cũ để tính giá
router.get("/", getAllPricePackages);
router.post("/calc", calcPrice);
router.post("/estimate", estimatePriceByAddress);
router.post("/estimate2", estimatePriceByAddress2);
export default router;