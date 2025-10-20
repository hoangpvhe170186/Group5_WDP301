import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  description: { type: String },
  quantity: { type: Number },
  weight: { type: mongoose.Types.Decimal128 },
  fragile: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("OrderItem", orderItemSchema);