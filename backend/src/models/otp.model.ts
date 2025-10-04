import mongoose, { Document, Schema } from 'mongoose';

// Định nghĩa interface cho Otp Document
interface IOtp extends Document {
  user_id: mongoose.Types.ObjectId;
  otp_code: string;
  attempts: number;
  expires_at: Date;
}

// Tạo otpSchema với TypeScript
const otpSchema: Schema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Liên kết với model User
      required: true,
      unique: true, // Đảm bảo chỉ có 1 OTP còn hiệu lực cho mỗi user
    },
    otp_code: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0, // Giới hạn 5 lần
      min: 0,
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

// Tạo chỉ mục để tự động xóa OTP khi hết hạn
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Tạo và xuất khẩu model Otp
const Otp = mongoose.model<IOtp>("Otp", otpSchema);

export default Otp;
