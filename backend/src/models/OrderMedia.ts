import mongoose from "mongoose";

const orderMediaSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  media_type: { type: String, enum: ["Before_Loading","After_Delivery","Incident","Other"] },
  file_url: { type: String },
  description: { type: String }
}, { timestamps: true });

export default mongoose.model("OrderMedia", orderMediaSchema);