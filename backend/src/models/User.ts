import mongoose, { Schema, Document } from "mongoose";

export enum Role {
  Admin = "Admin",
  Seller = "Seller",
  Customer = "Customer",
  Carrier = "Carrier",
}

export enum Status {
  Active = "Active",
  Inactive = "Inactive",
  Banned = "Banned",
}

interface IUser extends Document {
  full_name: string;
  email: string;
  password_hash: string;
  phone?: string;
  licenseNumber?: string;   // 🟩 GPLX
  vehiclePlate?: string;    // 🟩 Biển số
  role: Role;
  avatar?: string;
  status: Status;
  banReason?: string;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema(
  {
    full_name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, maxlength: 100 },
    phone: {
      type: String,
      maxlength: 20,
      match: [/^\d+$/, "Please use a valid phone number."],
    },
    licenseNumber: { type: String, maxlength: 50, default: "" }, // ✅ mới
    vehiclePlate: { type: String, maxlength: 20, default: "" },  // ✅ mới
    password_hash: { type: String, maxlength: 255 },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.Customer,
      required: true,
    },
    avatar: { type: String, required: false },
    status: {
      type: String,
      enum: Object.values(Status),
      default: Status.Active,
      required: true,
    },
    banReason: { type: String, required: false },
    created_by: { type: Number, required: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<IUser>("User", UserSchema);
