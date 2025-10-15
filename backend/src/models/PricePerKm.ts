import mongoose from "mongoose";

const pricePerKmSchema = new mongoose.Schema({
  package_id: { type: mongoose.Schema.Types.ObjectId, ref: "PricePackage", required: true },
  min_km: { type: Number, required: true },
  max_km: { type: Number },
  price: { type: mongoose.Types.Decimal128, required: true }
}, { timestamps: true });

export default mongoose.model("PricePerKm", pricePerKmSchema);