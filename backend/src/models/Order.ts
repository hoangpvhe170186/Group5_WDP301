import mongoose, { Schema, Document } from "mongoose";

export type OrderStatus =
  | "ASSIGNED"
  | "ACCEPTED"
  | "DECLINED"
  | "CONFIRMED"
  | "PICKUP_PENDING"
  | "ON_THE_WAY"
  | "ARRIVED"
  | "DELIVERING"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export interface IOrder extends Document {
  orderCode: string;
  customerId: Schema.Types.ObjectId;
  sellerId: Schema.Types.ObjectId;
  carrierId: Schema.Types.ObjectId;
  pickup: { address: string; name?: string; phone?: string; note?: string };
  dropoff: { address: string; name?: string; phone?: string; note?: string };
  goodsSummary: string;
  scheduledTime: Date;
  estimatePrice?: number;
  status: OrderStatus;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderCode: { type: String, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    carrierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pickup: { address: String, name: String, phone: String, note: String },
    dropoff: { address: String, name: String, phone: String, note: String },
    goodsSummary: String,
    scheduledTime: Date,
    estimatePrice: Number,
    status: { type: String, default: "ASSIGNED" },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", OrderSchema);
