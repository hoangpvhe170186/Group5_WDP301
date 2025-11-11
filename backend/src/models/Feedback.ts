import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number },
    comment: { type: String },
    category: { type: String, default: "General" },
    status: {
      type: String,
      enum: ["New", "InProgress", "Resolved"],
      default: "New",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    notes: { type: String, default: "" },
    handled_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    handled_at: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
