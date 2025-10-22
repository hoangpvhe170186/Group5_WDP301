// routes/extraFeeRoutes.ts
import express from "express";
import ExtraFee from "../models/ExtraFee";

const router = express.Router();

// ✅ Lấy tất cả phụ phí đang hoạt động
router.get("/", async (req, res) => {
  try {
    const fees = await ExtraFee.find({ is_active: true }).sort({ category: 1 });
    res.json({ success: true, data: fees });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách phụ phí" });
  }
});

export default router;