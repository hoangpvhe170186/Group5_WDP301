
import mongoose, { Schema, Document } from "mongoose";

export interface ISellerSalary extends Document {
  seller_id: mongoose.Types.ObjectId;
  month: number;   // 1-12
  year: number;    // 4 digits
  base_salary: number;
  commission_per_order: number;
  total_orders: number;
  successful_orders: number;
  failed_orders: number;
  bonus: number;
  total_earning: number;
  created_at: Date;
  updated_at: Date;
}

const SellerSalarySchema = new Schema<ISellerSalary>(
  {
    seller_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    base_salary: { type: Number, default: 0 },
    commission_per_order: { type: Number, default: 0 },
    total_orders: { type: Number, default: 0 },
    successful_orders: { type: Number, default: 0 },
    failed_orders: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    total_earning: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    indexes: [{ seller_id: 1, month: 1, year: 1, unique: true }],
  }
);

SellerSalarySchema.index({ seller_id: 1, month: 1, year: 1 }, { unique: true });

const SellerSalary = mongoose.model<ISellerSalary>("SellerSalary", SellerSalarySchema);
export default SellerSalary;
