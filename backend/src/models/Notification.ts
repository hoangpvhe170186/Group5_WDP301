import mongoose, { Schema, Types } from "mongoose";

interface Notification {
  user_id?: Types.ObjectId;                
  recipient_role?: "seller" | "admin";      
  order_id?: Types.ObjectId | null;
  ref_type?: "DriverInterview";             
  ref_id?: Types.ObjectId | null;           
  message: string;
  type: "System" | "Order Update" | "DriverInterview";
  is_read: boolean;
  created_at: Date;
   meta?: {
    image_url?: string;
    preferred_day?: string;
    time_slot?: string;     
    notes?: string;
  };
}

const NotificationSchema = new Schema<Notification>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    recipient_role: { type: String, enum: ["seller", "admin"] },
    order_id: { type: Schema.Types.ObjectId, ref: "Order" },
    ref_type: { type: String },
    ref_id: { type: Schema.Types.ObjectId },
    message: { type: String, required: true },
    type: { type: String, default: "DriverInterview", enum: ["System", "Order Update", "DriverInterview"] },
    is_read: { type: Boolean, default: false },
    meta: {
  image_url: { type: String },
  preferred_day: { type: String },
  time_slot: { type: String },
  notes: { type: String },
},

  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);
NotificationSchema.index({ recipient_role: 1, type: 1, created_at: -1 });
export default mongoose.model("Notification", NotificationSchema);
