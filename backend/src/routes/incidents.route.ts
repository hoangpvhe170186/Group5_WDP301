import { Router } from "express";
import Incident from "../models/Incident";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { Role } from "../models/User";

const router = Router();

// POST /api/incidents
// body: { order_id, type, description?, evidence_files?: [{public_id,url}] }
router.post(
  "/",
  requireAuth,
  requireRole(Role.Customer, Role.Seller, Role.Carrier),
  async (req, res) => {
  try {
    const { order_id, type = "Damage", description, evidence_files } = req.body || {};
    if (!order_id) return res.status(400).json({ message: "Thiếu order_id" });

    const doc: any = {
      order_id,
      reported_by: req.user._id || req.user.id,
      type,
      description: description || "",
    };
    if (Array.isArray(evidence_files)) doc.evidence_files = evidence_files; // mảng ảnh

    const incident = await Incident.create(doc);
    return res.status(201).json(incident);
  } catch (err) {
    return res.status(500).json({ message: "Lỗi khi gửi incident." });
  }
  }
);

// GET /api/incidents/:orderId
router.get(
  "/:orderId",
  requireAuth,
  requireRole(Role.Admin, Role.Seller, Role.Customer, Role.Carrier),
  async (req, res) => {
  const data = await Incident.find({ order_id: req.params.orderId }).sort({ createdAt: -1 });
  res.json(data);
  }
);

export default router;
