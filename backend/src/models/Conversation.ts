// src/models/Conversation.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  order_id: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  lastMessage?: { text: string; sender_id: mongoose.Types.ObjectId; at: Date };
}

const ConversationSchema = new Schema<IConversation>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    lastMessage: {
      text: String,
      sender_id: { type: Schema.Types.ObjectId, ref: "User" },
      at: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IConversation>("Conversation", ConversationSchema);
