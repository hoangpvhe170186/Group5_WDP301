import mongoose, { Schema, Document } from "mongoose";

export interface IUploadEvidence extends Document {
  orderId: Schema.Types.ObjectId;
  phase: "BEFORE" | "AFTER";
  files: { url: string; type: string }[];
  uploadedBy: Schema.Types.ObjectId;
}

const UploadEvidenceSchema = new Schema<IUploadEvidence>({
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  phase: { type: String, enum: ["BEFORE", "AFTER"], required: true },
  files: [
    {
      url: { type: String, required: true },   // ✅ CHUYỂN THÀNH SUB-SCHEMA
      type: { type: String, enum: ["IMAGE", "VIDEO"], required: true }
    }
  ],
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });


export default mongoose.model<IUploadEvidence>("UploadEvidence", UploadEvidenceSchema);
