import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    carrier_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plate_number: { type: String, unique: true, required: true },

    type: { type: String, required: true }, 
    capacity: { type: Number, default: 500 },

    image: {
      original: String,
      thumb: String,
      public_id: String,
      updatedAt: Date,
    },

    status: {
      type: String,
      enum: ["Available", "In Use", "Maintenance"],
      default: "Available",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);