import mongoose, { Schema, Types } from "mongoose";

export interface DriverInterviewRequest {
  full_name: string;
  phone: string;
  email: string;
  city: "hcm" | "hn" | "dn";
  vehicle_type: string;
  preferred_day: Date;
  time_slot: "morning" | "afternoon";
  notes?: string;

  status: "pending" | "qualified" | "rejected";
  reviewed_by?: Types.ObjectId;
  reviewed_at?: Date;

  note_image?: {
    url: string;
    public_id?: string;
  } | null;

  created_at: Date;
  updated_at: Date;
}

const DriverInterviewRequestSchema = new Schema<DriverInterviewRequest>(
  {
    full_name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    city: { type: String, required: true, enum: ["hcm", "hn", "dn"] },

    vehicle_type: {
      type: String,
      trim: true,
      default: "truck",
      required: true,
      validate: {
        validator: (v: string) => typeof v === "string" && v.trim().length >= 2 && v.trim().length <= 100,
        message: "Loại xe không hợp lệ, vui lòng nhập tên hợp lý (2–100 ký tự).",
      },
    },

    preferred_day: { type: Date, required: true },
    time_slot: { type: String, required: true, enum: ["morning", "afternoon"] },
    notes: { type: String, default: "" },

    note_image: {
      url: { type: String },
      public_id: { type: String },
    },

    status: {
      type: String,
      default: "pending",
      enum: ["pending", "qualified", "rejected"],
    },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "User" },
    reviewed_at: { type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

DriverInterviewRequestSchema.index({ phone: 1, email: 1, created_at: -1 });

export default mongoose.model<DriverInterviewRequest>(
  "DriverInterviewRequest",
  DriverInterviewRequestSchema
);
