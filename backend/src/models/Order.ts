import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
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
    status: { type: String, default: "Pending" },
    total_price: { type: Number, required: true },

    // ✅ NEW FIELDS ADDED BELOW
    declineReason: { type: String, default: null },
    signatureUrl: { type: String, default: null },

    auditLogs: [
      {
        at: { type: Date, default: Date.now },
<<<<<<< HEAD
        by: { type: String }, // user_id / carrier_id
        action: { type: String }, // e.g. "ACCEPTED", "DECLINED", "PROGRESS:DELIVERING"
        note: { type: String, default: "" }, // optional comment
=======
        by: { type: String }, 
        action: { type: String },
        note: { type: String, default: "" }, 
>>>>>>> long
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
