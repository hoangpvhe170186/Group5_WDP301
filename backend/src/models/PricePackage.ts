import mongoose from "mongoose";

const pricePackageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Dùng name làm định danh duy nhất
  vehicle: { type: String, required: true },
  workers: { type: String, required: true },
  max_floor: { type: Number, default: 1 },
  wait_time: { type: Number, default: 2 },
  base_price: { type: mongoose.Types.Decimal128, required: true }
}, { timestamps: true });

export default mongoose.model("PricePackage", pricePackageSchema);