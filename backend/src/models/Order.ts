import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pickup_address: { type: String, required: true },
    pickup_detail: { type: String },
    delivery_address: { type: String, required: true },
    total_price: { type: Number, required: true },
    package_id: { type: mongoose.Schema.Types.ObjectId, ref: "PricePackage", required: true },
    phone: { type: String, required: true },
    delivery_schedule: {
      type: {
        type: String,
        enum: ["now", "later"], // "Bây giờ" hoặc "Đặt lịch"
        default: "now",
      },
      datetime: {
        type: Date, // Thời gian thực tế (nếu "later")
        default: null,
      },
    },
    // 🏢 Thêm trường mới:
    max_floor: { type: Number, default: 1 }, // Người dùng có thể chỉnh tầng tối đa

    // các trường khác nếu có
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);