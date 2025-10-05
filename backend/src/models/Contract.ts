import mongoose from "mongoose";

const contractSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  carrier_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customer_confirmation: { type: Boolean, default: false },
  contract_file: { type: String }
}, { timestamps: true });

export default mongoose.model("Contract", contractSchema);