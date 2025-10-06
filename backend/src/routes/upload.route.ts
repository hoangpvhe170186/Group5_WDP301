import { Router } from "express";
import multer from "multer";
import cloudinary from "../lib/cloudinary";

const router = Router();
const upload = multer({ dest: "tmp/" }); // thư mục tạm

// POST /api/upload/vehicle
router.post("/vehicle", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const { plate_number } = req.body; // tùy bạn muốn đặt tên file theo gì

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "vehicles",
      public_id: plate_number || undefined, // ví dụ: "29A-11111"
      overwrite: true,
      resource_type: "image",
    });

    return res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
