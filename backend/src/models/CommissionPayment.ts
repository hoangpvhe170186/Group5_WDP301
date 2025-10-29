import mongoose from "mongoose";

const commissionPaymentSchema = new mongoose.Schema(
  {
    debtId: { type: mongoose.Schema.Types.ObjectId, ref: "CarrierDebt" },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    carrierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderCode: { type: String, required: true },
    amount: { type: mongoose.Types.Decimal128, required: true },
    paymentMethod: { type: String, default: "Bank Transfer" },
    
    // PayOS fields
    payosCode: { type: String }, // Mã giao dịch từ PayOS
    payosLink: { type: String }, // Link people PayOS
    qrCode: { type: String }, // URL QR code từ PayOS
    
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    
    description: { type: String, required: true }, // Nội dung chuyển khoản
    paidAt: { type: Date }, // Thời gian thanh toán xong (từ webhook)
    
    // Metadata từ PayOS webhook
    metadata: {
      transactionDate: { type: Date },
      amount: { type: mongoose.Types.Decimal128 },
      description: { type: String },
      reference: { type: String },
      accountName: { type: String },
      accountNumber: { type: String },
      partnerTransactionId: { type: String },
    },
  },
  { timestamps: true }
);

// Index để tìm nhanh payment của carrier
commissionPaymentSchema.index({ carrierId: 1, orderId: 1 });
commissionPaymentSchema.index({ payosCode: 1 });

export default mongoose.model("CommissionPayment", commissionPaymentSchema);

