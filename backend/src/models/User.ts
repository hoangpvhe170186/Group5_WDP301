import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ["Admin", "Seller", "Customer", "Driver", "Carrier"], required: true },
  avatar: { type: String },
  status: { type: String, enum: ["Active", "Inactive", "Suspended"], default: "Active" },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);