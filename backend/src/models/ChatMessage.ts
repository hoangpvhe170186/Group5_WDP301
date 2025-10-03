import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage extends Document {
  userId: string;
  role: "user" | "bot" | "agent";
  text: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: String, required: true },
    role: { type: String, enum: ["user", "bot", "agent"], required: true },
    text: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ChatMessage = mongoose.model<IChatMessage>(
  "ChatMessage",
  ChatMessageSchema
);
