import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  plate_number: { type: String, unique: true },
  type: { type: String, enum: ["Truck"], required: true },
  capacity: { type: Number },
   image: {
    original: String,      
    thumb: String,         
    public_id: String,     
    updatedAt: Date
  },
  status: { type: String, enum: ["Available", "In Use", "Maintenance"], default: "Available" }
},{ timestamps: true });

export default mongoose.model("Vehicle", vehicleSchema);