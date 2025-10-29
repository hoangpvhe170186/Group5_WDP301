import mongoose from "mongoose";

const carrierDebtSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    carrierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderCode: { type: String, required: true },
    totalOrderPrice: { type: mongoose.Types.Decimal128, required: true },
    commissionAmount: { type: mongoose.Types.Decimal128, required: true }, // 20% của total
    debtStatus: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED"],
      default: "PENDING",
    },
    paidAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

// Index để tìm nhanh debt của carrier và order
carrierDebtSchema.index({ carrierId: 1, orderId: 1 });

export default mongoose.model("CarrierDebt", carrierDebtSchema);

