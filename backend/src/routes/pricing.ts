import { Router } from "express";
import { calcPrice } from "../controllers/pricing.controller";

const router = Router();

router.post("/calc", calcPrice);

export default router;
