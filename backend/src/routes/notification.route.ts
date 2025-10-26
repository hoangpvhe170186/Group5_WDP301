// routes/notification.route.ts
import { Router } from "express";
import Notification from "../models/Notification";

const r = Router();

r.get("/", async (req, res) => {
  const { recipient_role, type } = req.query as { recipient_role?: string; type?: string };
  const filter: any = {};
  if (recipient_role) filter.recipient_role = recipient_role;
  if (type) filter.type = type;
  const docs = await Notification.find(filter).sort({ created_at: -1 }).limit(100).lean();
  res.json(docs);
});

r.patch("/:id/read", async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { is_read: true });
  res.json({ ok: true });
});

export default r;
