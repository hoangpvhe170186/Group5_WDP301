import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    weight: { type: mongoose.Types.Decimal128, required: true },
    fragile: { type: Boolean, default: false },

    // ✅ Các loại hàng
    type: {
      type: [String],
      enum: [
        "Thực phẩm & Đồ uống",
        "Văn phòng phẩm",
        "Quần áo & Phụ kiện",
        "Đồ điện tử",
        "Nguyên vật liệu / Linh kiện",
        "Đồ gia dụng / Nội thất",
        "Khác",
      ],
      default: [],
    },

    // ✅ Hướng dẫn vận chuyển (các checkbox)
    shipping_instructions: {
      type: [String],
      enum: [
        "Hàng dễ vỡ",
        "Giữ khô ráo",
        "Cần nhiệt độ thích hợp",
        "Thực phẩm có mùi",
      ],
      default: [],
    },

    // ✅ Ghi chú cho tài xế
    driver_note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("OrderItem", orderItemSchema);
