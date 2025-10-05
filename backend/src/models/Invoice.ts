import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  amount: { type: mongoose.Types.Decimal128 },
  payment_method: { type: String, enum: ["Cash","Card","Bank Transfer","E-Wallet"] },
  payment_status: { type: String, enum: ["Pending","Paid","Failed","Refunded"], default: "Pending" }
}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema);