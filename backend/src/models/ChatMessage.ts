import mongoose, { Schema, Document } from "mongoose";

export type ChatSender = "guest" | "seller" | "bot";
export interface IChatMessage extends Document {
  roomId: string;                  
  userId?: string;                 
  sender: ChatSender;              
  senderName?: string;             
  text: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    roomId: { type: String, index: true, required: true },
    userId: { type: String },
    sender: { type: String, enum: ["guest", "seller", "bot"], required: true },
    senderName: { type: String },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export default mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
