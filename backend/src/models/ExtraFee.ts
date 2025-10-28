import mongoose from "mongoose";

const extraFeeSchema = new mongoose.Schema({
  category: { type: String, required: true }, 
  name: { type: String, required: true },     
  price: { type: mongoose.Types.Decimal128, required: true }, 
  description: { type: String },
  is_active: { type: Boolean, default: true }, 
}, { timestamps: true });

export default mongoose.model("ExtraFee", extraFeeSchema);