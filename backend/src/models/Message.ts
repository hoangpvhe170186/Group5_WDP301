    import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: { type: String },
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);