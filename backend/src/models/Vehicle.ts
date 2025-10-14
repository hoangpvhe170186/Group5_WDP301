import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    plate_number: { type: String, unique: true, required: true },

    // Loại xe
    type: { type: String, enum: ["Truck"], required: true },
    capacity: { type: Number },

    // Hình ảnh
    image: {
      original: String,
      thumb: String,
      public_id: String,
      updatedAt: Date,
    },

    // Trạng thái xe
    status: {
      type: String,
      enum: ["Available", "In Use", "Maintenance"],
      default: "Available",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
