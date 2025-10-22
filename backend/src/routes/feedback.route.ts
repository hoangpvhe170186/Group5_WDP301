import { Router } from "express";
import Feedback from "../models/Feedback";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// POST /api/feedback  { order_id, rating, comment? }
router.post("/", requireAuth, async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body || {};
    if (!order_id || !rating) return res.status(400).json({ message: "Thiếu order_id hoặc rating" });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: "rating phải 1-5" });

    const doc = await Feedback.create({
      order_id,
      customer_id: req.user._id || req.user.id,
      rating,
      comment: comment || "",
    });
    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ message: "Gửi đánh giá thất bại" });
  }
});

// GET /api/feedback/my?limit=20
router.get("/my", requireAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 20), 50);
  const items = await Feedback.find({ customer_id: req.user._id || req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ items });
});

export default router;
