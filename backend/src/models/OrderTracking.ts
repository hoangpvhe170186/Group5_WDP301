import mongoose, { Schema, Types } from "mongoose";

export type TrackingStatus =
  | "ASSIGNED"
  | "ACCEPTED"
  | "CONFIRMED"
  | "ON_THE_WAY"
  | "ARRIVED"
  | "DELIVERING"
  | "DELIVERED"
  | "COMPLETED"
  | "INCIDENT"
  | "PAUSED";

const orderTrackingSchema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    carrier_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, required: true },
    note: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("OrderTracking", orderTrackingSchema);
