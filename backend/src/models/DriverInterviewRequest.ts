import mongoose, { Schema, Types } from "mongoose";

export interface DriverInterviewRequest {
  full_name: string;
  phone: string;
  email: string;
  city: "hcm" | "hn" | "dn";
  vehicle_type: "van" | "truck" | "3gac";
  preferred_day: Date;
  time_slot: "morning" | "afternoon";
  notes?: string;

  status: "pending" | "qualified" | "rejected";
  reviewed_by?: Types.ObjectId;     // user _id (seller/admin) duyệt
  reviewed_at?: Date;

  created_at: Date;
  updated_at: Date;
}

const DriverInterviewRequestSchema = new Schema<DriverInterviewRequest>(
  {
    full_name: { type: String, required: true },
    phone:     { type: String, required: true },
    email:     { type: String, required: true },
    city:      { type: String, required: true, enum: ["hcm", "hn", "dn"] },
    vehicle_type: { type: String, required: true, enum: ["van", "truck", "3gac"] },
    preferred_day: { type: Date, required: true },
    time_slot:  { type: String, required: true, enum: ["morning", "afternoon"] },
    notes:      { type: String },

    status:     { type: String, default: "pending", enum: ["pending", "qualified", "rejected"] },
    reviewed_by:{ type: Schema.Types.ObjectId, ref: "User" },
    reviewed_at:{ type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

DriverInterviewRequestSchema.index({ phone: 1, email: 1, created_at: -1 });

export default mongoose.model("DriverInterviewRequest", DriverInterviewRequestSchema);
