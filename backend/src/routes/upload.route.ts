import { Router } from "express";
import multer from "multer";
import cloudinary from "../lib/cloudinary";
import { requireAuth } from "../middleware/requireAuth";
import fs from "fs";
import streamifier from "streamifier";
const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Thiếu file" });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "driver_notes",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (err, result) => {
        if (err || !result) {
          return res.status(500).json({ message: "Upload thất bại" });
        }
        return res.json({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    // đẩy buffer lên Cloudinary
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Có lỗi khi xử lý upload" });
  }
});
// POST /api/upload/images  (multi, trả về [{public_id,url}])
router.post("/images", requireAuth, upload.array("files", 10), async (req, res) => {
  try {
    const folder = (req.body.folder as string) || "orders/incidents";
    const files = (req.files as Express.Multer.File[]) || [];
    const results: { public_id: string; url: string }[] = [];

    for (const f of files) {
      const r = await cloudinary.uploader.upload(f.path, { folder, resource_type: "image" });
      results.push({ public_id: r.public_id, url: r.secure_url });
      // dọn file tạm
      try { fs.unlinkSync(f.path); } catch {}
    }

    return res.json(results);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Upload failed" });
  }
});

// (tuỳ chọn) POST /api/upload/vehicle   single file -> {url, public_id}
router.post("/vehicle", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const { plate_number } = req.body;

    const r = await cloudinary.uploader.upload(req.file.path, {
      folder: "vehicles",
      public_id: plate_number || undefined,
      overwrite: true,
      resource_type: "image",
    });

    try { fs.unlinkSync(req.file.path); } catch {}
    return res.json({ url: r.secure_url, public_id: r.public_id });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Upload failed" });
  }
});

// (tuỳ chọn) POST /api/upload/avatar   single file -> {url, public_id}
router.post("/avatar", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const { user_id } = req.body;

    const r = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
      public_id: user_id || undefined,
      overwrite: true,
      resource_type: "image",
    });

    try { fs.unlinkSync(req.file.path); } catch {}
    return res.json({ success: true, url: r.secure_url, public_id: r.public_id });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message || "Upload failed" });
  }
});

export default router;
