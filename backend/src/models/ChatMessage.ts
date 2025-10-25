// models/ChatMessage.ts
import mongoose, { Schema, Document } from "mongoose";

export type Sender = "guest" | "seller" | "bot";

export interface IChatMessage extends Document {
  roomId: string;          // "room:order:<orderId>" hoặc customer_chat_id
  orderId?: mongoose.Types.ObjectId;
  sender: Sender;
  senderName?: string;
  text: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    roomId: { type: String, index: true, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    sender: { type: String, enum: ["guest", "seller", "bot"], required: true },
    senderName: String,
    text: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Tối ưu các truy vấn lịch sử theo room + thời gian
ChatMessageSchema.index({ roomId: 1, createdAt: 1 });

export default mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
