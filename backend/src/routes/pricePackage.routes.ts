import { Router } from "express";
import PricePackage from "../models/PricePackage"; // Đảm bảo đúng đường dẫn model

const router = Router();

// ✅ Lấy danh sách tất cả gói dịch vụ
router.get("/", async (req, res) => {
  try {
    const packages = await PricePackage.find();
    res.status(200).json(packages);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách gói:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách gói." });
  }
});

export default router;