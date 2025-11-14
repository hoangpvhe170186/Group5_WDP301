import { Router } from "express";
import { applyInterview, listInterviews, updateStatus } from "../controllers/driverInterview.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { Role } from "../models/User";

const router = Router();

router.post("/apply", applyInterview);
router.get("/", requireAuth, requireRole(Role.Admin, Role.Seller), listInterviews);
router.patch("/:id/status", requireAuth, requireRole(Role.Admin, Role.Seller), updateStatus);

export default router;
