import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  reported_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["Damage","Delay","Missing Item","Vehicle Issue","Other"] },
  description: { type: String },
  evidence_file: { type: String },
  resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolution: { type: String },
  resolved_at: { type: Date }
}, { timestamps: true });

export default mongoose.model("Incident", incidentSchema);