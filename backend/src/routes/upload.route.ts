import { Router } from "express";
import multer from "multer";
import cloudinary from "../lib/cloudinary";
import { requireAuth } from "../middleware/requireAuth";
<<<<<<< HEAD
import streamifier from "streamifier";

const router = Router();

// Sử dụng memoryStorage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ✅ FIXED: Upload multiple images với memoryStorage
router.post("/images", requireAuth, upload.array("files", 10), async (req, res) => {
  try {
    const folder = (req.body.folder as string) || "orders";
    const files = (req.files as Express.Multer.File[]) || [];
    
    console.log("📤 Nhận request upload:", {
      fileCount: files.length,
      folder: folder,
      fileNames: files.map(f => f.originalname)
    });

    if (files.length === 0) {
      return res.status(400).json({ error: "Không có file nào được chọn" });
    }

    const results: { public_id: string; url: string }[] = [];

    // Upload từng file sử dụng buffer
    for (const file of files) {
      try {
        console.log(`📤 Uploading: ${file.originalname} (${file.size} bytes)`);
        
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: folder,
              resource_type: "image",
              transformation: [
                { quality: "auto", fetch_format: "auto" },
                { width: 1200, height: 1200, crop: "limit" }
              ]
            },
            (error, result) => {
              if (error) {
                console.error(`❌ Upload failed for ${file.originalname}:`, error);
                reject(error);
              } else {
                console.log(`✅ Upload success: ${file.originalname} -> ${result.public_id}`);
                resolve(result);
              }
            }
          );
          
          // Sử dụng buffer từ memoryStorage
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });

        if (result) {
          results.push({
            public_id: (result as any).public_id,
            url: (result as any).secure_url
          });
        }
      } catch (fileError) {
        console.error(`❌ Lỗi upload file ${file.originalname}:`, fileError);
        // Tiếp tục với các file khác nếu một file lỗi
      }
    }

    if (results.length === 0) {
      return res.status(500).json({ error: "Không thể upload bất kỳ file nào" });
    }

    console.log(`✅ Upload completed: ${results.length}/${files.length} files`);
    return res.json(results);
  } catch (e: any) {
    console.error("❌ Lỗi upload images:", e);
    return res.status(500).json({ 
      error: e.message || "Upload failed",
      details: "Internal server error"
    });
  }
});

// ✅ FIXED: Upload single file
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Thiếu file" });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "driver_notes",
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    return res.json({
      url: (result as any).secure_url,
      public_id: (result as any).public_id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Có lỗi khi xử lý upload" });
  }
});
=======
import fs from "fs";

const router = Router();
const upload = multer({ dest: "tmp/" }); // lưu tạm lên đĩa

// POST /api/upload/images  (multi, trả về [{public_id,url}])
router.post("/images", requireAuth, upload.array("files", 10), async (req, res) => {
  try {
    const folder = (req.body.folder as string) || "orders/incidents";
    const files = (req.files as Express.Multer.File[]) || [];
    const results: { public_id: string; url: string }[] = [];
>>>>>>> long

// ✅ FIXED: Upload vehicle image
router.post("/vehicle", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const { plate_number } = req.body;

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "vehicles",
          public_id: plate_number || undefined,
          overwrite: true,
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    return res.json({ 
      url: (result as any).secure_url, 
      public_id: (result as any).public_id 
    });
  } catch (e: any) {
    console.error("❌ Lỗi upload vehicle:", e);
    return res.status(500).json({ error: e.message || "Upload failed" });
  }
});

// ✅ FIXED: Upload avatar
router.post("/avatar", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const { user_id } = req.body;

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "avatars",
          public_id: user_id || undefined,
          overwrite: true,
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    return res.json({ 
      success: true, 
      url: (result as any).secure_url, 
      public_id: (result as any).public_id 
    });
  } catch (e: any) {
    console.error("❌ Lỗi upload avatar:", e);
    return res.status(500).json({ 
      success: false, 
      error: e.message || "Upload failed" 
    });
  }
});

export default router;