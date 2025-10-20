// cleanup-evidence.js
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load ENV
dotenv.config();

// ✅ CONNECT DB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yourdbname";

async function cleanup() {
  console.log("🚀 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);

  // ✅ COLLECTION NAME CHÍNH XÁC TRONG DB
  const UploadEvidence = mongoose.connection.collection("uploadevidences");

  console.log("🗑 Xóa toàn bộ record trong UploadEvidence...");
  await UploadEvidence.deleteMany({});

  // ✅ DỌN FILE TRONG /uploads
  const uploadsPath = path.join(process.cwd(), "uploads");
  console.log("🧹 Dọn file trong thư mục:", uploadsPath);

  if (fs.existsSync(uploadsPath)) {
    const files = fs.readdirSync(uploadsPath);
    for (const file of files) {
      fs.unlinkSync(path.join(uploadsPath, file));
    }
    console.log(`✅ Đã xóa ${files.length} file`);
  } else {
    console.log("⚠ Folder uploads/ không tồn tại");
  }

  await mongoose.disconnect();
  console.log("✅ DONE! DB và thư mục uploads/ đã được reset sạch.");
}

cleanup().catch((err) => {
  console.error("❌ Lỗi cleanup:", err);
  process.exit(1);
});
