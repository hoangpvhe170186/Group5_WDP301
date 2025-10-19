import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import OrderMedia from "../models/OrderMedia"; 
import { Types } from "mongoose";

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

r.post("/api/orders/:orderId/evidence", upload.array("files", 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const phase = (req.query.phase as "BEFORE"|"AFTER"|"INCIDENT") || "BEFORE";
    const userId = (req as any).user?._id; // nếu có auth; tạm thời có thể null

    if (!Types.ObjectId.isValid(orderId)) return res.status(400).json({ message: "orderId invalid" });
    if (!req.files || !(req.files as Express.Multer.File[]).length) return res.status(400).json({ message: "No files" });

    const uploads = await Promise.all((req.files as Express.Multer.File[]).map(file =>
      new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `orders/${orderId}`,
            resource_type: "auto",        // ảnh hoặc video
            overwrite: false
          },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(file.buffer);
      })
    ));

    // Lưu Mongo từng file
    const docs = await OrderMedia.insertMany(
      uploads.map(u => ({
        order_id: new Types.ObjectId(orderId),
        uploaded_by: userId ? new Types.ObjectId(userId) : undefined,
        media_type: phase === "BEFORE" ? "Before_Loading" : phase === "AFTER" ? "After_Delivery" : "Incident",
        file_url: u.secure_url,
        // tuỳ chọn: lưu thêm public_id, thumbnail, width/height, format...
        public_id: u.public_id,
        thumb_url: cloudinary.url(u.public_id, { transformation: [{ width: 800, height: 600, crop: "fill", fetch_format: "auto", quality: "auto" }] }),
        description: req.body?.notes || ""
      }))
    );

    res.json({ ok: true, count: docs.length, items: docs });
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ message: "Upload failed", error: e.message });
  }
});

export default r;