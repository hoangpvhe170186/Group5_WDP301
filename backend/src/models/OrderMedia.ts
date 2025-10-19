import { Schema, model, Types } from "mongoose";

const OrderMediaSchema = new Schema(
  {
    order_id: { type: Types.ObjectId, ref: "orders", required: true, index: true },
    uploaded_by: { type: Types.ObjectId, ref: "users" },
    media_type: { type: String, enum: ["Before_Loading", "After_Delivery", "Incident"], required: true },
    resource_type: { type: String, enum: ["image", "video"], default: "image" },
    file_url: { type: String, required: true },
    thumb_url: { type: String },
    public_id: { type: String, required: true },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

export default model("orderMedia", OrderMediaSchema);