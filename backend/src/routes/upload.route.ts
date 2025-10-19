import { Router } from "express";
import multer from "multer";
import cloudinary from "../lib/cloudinary";        
import fs from "node:fs";
import path from "node:path";
import { Types } from "mongoose";
import OrderMedia from "../models/OrderMedia";
import { cldThumb } from "../utils/cloudinaryUrl";

const router = Router();

/* Multer: lưu tạm rồi xoá */
const TMP_DIR = path.join(process.cwd(), "uploads_tmp");
fs.mkdirSync(TMP_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: TMP_DIR,
    filename: (_req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const safe = file.originalname.replace(/\s+/g, "_");
      cb(null, `${unique}-${safe}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

type Phase = "BEFORE" | "AFTER" | "INCIDENT";
const toMedia = (p: Phase) =>
  p === "AFTER" ? "After_Delivery" : p === "INCIDENT" ? "Incident" : "Before_Loading";

/**
 * POST /api/orders/:orderId/evidence?phase=BEFORE|AFTER|INCIDENT
 * FormData: files[] (bắt buộc), notes? (optional)
 */
router.post("/orders/:orderId/evidence", upload.array("files", 10), async (req, res) => {
  try {
    // kiểm biến môi trường (để log dễ hiểu nếu thiếu)
    ["CLOUDINARY_CLOUD_NAME","CLOUDINARY_API_KEY","CLOUDINARY_API_SECRET"].forEach((k) => {
      if (!process.env[k]) throw new Error(`Missing Cloudinary env: ${k}`);
    });

    const { orderId } = req.params;
    const phase = (String(req.query.phase || "BEFORE").toUpperCase() as Phase);

    if (!Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "orderId invalid" });
    }

    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) return res.status(400).json({ message: "No files" });

    const docsToInsert: any[] = [];

    for (const f of files) {
      try {
        const uploaded = await cloudinary.uploader.upload(f.path, {
          folder: `orders/${orderId}`,
          resource_type: "auto",
        });

        // dọn file tạm sau mỗi lần upload
        try { fs.unlinkSync(f.path); } catch {}

        const rt = (uploaded.resource_type === "video" ? "video" : "image") as "image" | "video";

        const doc: any = {
          order_id: new Types.ObjectId(orderId),
          media_type: toMedia(phase),
          resource_type: rt,
          file_url: uploaded.secure_url,
          public_id: uploaded.public_id,
          thumb_url: cldThumb(uploaded.public_id, rt),
          description: (req.body?.notes as string) || "",
        };

        const uid = (req as any)?.user?._id;
        if (uid && Types.ObjectId.isValid(uid)) doc.uploaded_by = new Types.ObjectId(uid);

        docsToInsert.push(doc);
      } catch (e: any) {
        console.error("Cloudinary upload error:", e?.message || e);
        return res.status(502).json({
          message: "Cloudinary upload failed",
          error: e?.message || String(e),
        });
      } finally {
        // đảm bảo file tạm được xoá nếu Cloudinary fail
        try { fs.existsSync(f.path) && fs.unlinkSync(f.path); } catch {}
      }
    }

    const saved = await OrderMedia.insertMany(docsToInsert);
    return res.json({ ok: true, count: saved.length, items: saved });
  } catch (e: any) {
    console.error("Upload evidence failed:", e);
    return res.status(500).json({ message: "Upload failed", error: e?.message || String(e) });
  }
});

/** GET /api/orders/:orderId/evidence?phase=... */
router.get("/orders/:orderId/evidence", async (req, res) => {
  try {
    const { orderId } = req.params;
    const phase = (req.query.phase as string) || "";
    const q: any = { order_id: orderId };
    if (phase) q.media_type = toMedia(phase.toUpperCase() as Phase);

    const items = await OrderMedia.find(q).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e: any) {
    console.error("List evidence failed:", e);
    res.status(500).json({ message: "List failed", error: e?.message || String(e) });
  }
});

export default router;
