import mongoose from "mongoose";
import { generateCode } from "../utils/generateOrderCode";

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, unique: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    seller_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    carrier_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    phone: { type: String, required: true },
    package_id: { type: mongoose.Schema.Types.ObjectId, ref: "PricePackage" },
    pickup_address: { type: String, required: true },
    delivery_address: { type: String, required: true },
    scheduled_time: { type: Date },
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

    total_price: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },

    assignedCarrier: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    availableAt: { type: Date, default: null },

    declineReason: { type: String, default: null },
    signatureUrl: { type: String, default: null },
 images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    auditLogs: [
      {
        at: { type: Date, default: Date.now },
        by: { type: String },
        action: { type: String },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

// 🧠 Auto-generate unique orderCode
orderSchema.pre("save", async function (next) {
  if (!this.orderCode) {
    let unique = false;
    while (!unique) {
      const code = generateCode("ORD");
      const existing = await mongoose.models.Order.findOne({ orderCode: code });
      if (!existing) {
        this.orderCode = code;
        unique = true;
      }
    }
  }
  next();
});

export default mongoose.model("Order", orderSchema);
