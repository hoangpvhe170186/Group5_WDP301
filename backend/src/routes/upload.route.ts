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

// POST /api/upload/avatar
router.post("/avatar", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const { user_id } = req.body; // ID của user để đặt tên file

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
      public_id: user_id || undefined, // đặt tên file theo user_id
      overwrite: true,
      resource_type: "image",
      transformation: [
        { width: 300, height: 300, crop: "fill" }, // resize thành hình vuông 300x300
        { quality: "auto" }, // tự động tối ưu chất lượng
      ],
    });

    return res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (e: any) {
    return res.status(500).json({ 
      success: false,
      error: e.message 
    });
  }
});

export default router;
