import { Router } from "express";
import * as ctrl from "../controllers/driverInterview.controller";

const r = Router();

r.post("/apply", ctrl.applyInterview);
r.get("/list", ctrl.listInterviews);
r.patch("/:id/status", ctrl.updateStatus);

export default r;