import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number },
  comment: { type: String }
}, { timestamps: true });

export default mongoose.model("Feedback", feedbackSchema);