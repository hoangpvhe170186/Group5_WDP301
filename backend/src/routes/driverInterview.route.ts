import { Router } from "express";
import { applyInterview, listInterviews, updateStatus } from "../controllers/driverInterview.controller";

const router = Router();

router.post("/apply", applyInterview);
router.get("/", listInterviews);
router.patch("/:id/status", updateStatus);

export default router;