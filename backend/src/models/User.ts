import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ["Admin","Seller","Customer","Driver","Carrier"], required: true },
  status: { type: String, enum: ["Active","Inactive","Suspended"], default: "Active" },
  avatar: { type: String }
}, { timestamps: true });

export default mongoose.model("User", userSchema);