import mongoose, { Schema, Document, Model } from "mongoose";

export function makeFAQKey(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/[^\p{L}\p{N}\s?.!,:'"-]/gu, "") // bỏ ký tự lạ (giữ chữ/số/khoảng trắng/một số dấu cơ bản)
    .replace(/\s+/g, " ")
    .trim();
}

export interface IFAQCache extends Document {
  qKey: string;      // khoá chuẩn hoá (duy nhất)
  qText: string;     // nguyên văn câu hỏi gốc (gần nhất)
  aText: string;     // câu trả lời đã duyệt / sinh ra
  hits: number;      // số lần dùng cache
  updatedAt: Date;   // tự quản bởi timestamps
  createdAt: Date;   // tự quản bởi timestamps
}

const FAQCacheSchema = new Schema<IFAQCache>(
  {
    qKey: { type: String, required: true, unique: true, index: true },
    qText: { type: String, required: true },
    aText: { type: String, required: true },
    hits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index hỗn hợp nếu sau này muốn truy vấn text
FAQCacheSchema.index({ qKey: 1 });

const FAQCache: Model<IFAQCache> =
  mongoose.models.FAQCache || mongoose.model<IFAQCache>("FAQCache", FAQCacheSchema);

export default FAQCache;
