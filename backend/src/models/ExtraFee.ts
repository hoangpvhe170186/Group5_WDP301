import mongoose from "mongoose";

const extraFeeSchema = new mongoose.Schema({
  category: { type: String, required: true }, // Ví dụ: "Dịch vụ bốc xếp"
  name: { type: String, required: true },     // Ví dụ: "Bốc xếp tận nơi"
  price: { type: mongoose.Types.Decimal128, required: true }, // Giá tiền
  description: { type: String },
  is_active: { type: Boolean, default: true }, // Cho phép bật/tắt hiển thị
}, { timestamps: true });

export default mongoose.model("ExtraFee", extraFeeSchema);