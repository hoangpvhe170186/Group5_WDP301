import { Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

// Gắn các route con
router.use(authRoutes);

export default router;
