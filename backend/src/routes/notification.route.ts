// routes/notification.route.ts
import { Router } from "express";
import Notification from "../models/Notification";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { Role } from "../models/User";

const r = Router();

r.get(
  "/",
  requireAuth,
  requireRole(Role.Admin, Role.Seller, Role.Customer, Role.Carrier),
  async (req, res) => {
  const { type, recipient_role } = req.query as { type?: string; recipient_role?: string };

  const q: any = {};
  if (type) q.type = type;
  if (recipient_role) q.recipient_role = recipient_role;

  const items = await Notification
    .find(q)
    .sort({ created_at: -1 })
    .lean();            

  res.json(items);
  }
);

r.patch(
  "/:id/read",
  requireAuth,
  requireRole(Role.Admin, Role.Seller, Role.Customer, Role.Carrier),
  async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ ok: true });
  }
);

export default r;
