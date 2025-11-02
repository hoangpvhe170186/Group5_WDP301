import mongoose from "mongoose";

const orderStatusLogSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
      type: String,
      enum: [
        "Pending",
        "CONFIRMED",
        "AVAILABLE",
        "ASSIGNED",
        "ACCEPTED",
        "ON_THE_WAY",
        "ARRIVED",
        "INCIDENT",
        "DELIVERED",
        "PAUSED",
        "DECLINED",
        "COMPLETED",
        "CANCELLED",
        "NOTE"
      ],
      default: "Pending",
    },
  note: { type: String }
}, { timestamps: true });

export default mongoose.model("OrderStatusLog", orderStatusLogSchema);