import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  carrier_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  package_id: { type: mongoose.Schema.Types.ObjectId, ref: "PricePackage" },
  pickup_address: { type: String },
  delivery_address: { type: String },
  scheduled_time: { type: Date },
  status: { type: String, enum: ["Draft","Pending","Confirmed","In Transit","Completed","Canceled"], default: "Pending" },
  total_price: { type: mongoose.Types.Decimal128 },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);