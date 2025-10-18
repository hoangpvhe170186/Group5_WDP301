// src/models/Message.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  order_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  receiver_id?: mongoose.Types.ObjectId;
  type: "text" | "image" | "file" | "system";
  text?: string;                 // thay cho 'content'
  media?: { url: string; type?: string }; // nếu gửi ảnh/file
  status: "sent" | "delivered" | "seen";
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    sender_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiver_id: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["text", "image", "file", "system"], default: "text" },
    text: { type: String },
    media: { url: String, type: String },
    status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent", index: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>("Message", MessageSchema);
