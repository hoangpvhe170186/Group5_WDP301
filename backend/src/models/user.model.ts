import mongoose, { Schema, Document } from 'mongoose';

// Enum cho role và status
export enum Role {
  Admin = 'Admin',
  Seller = 'Seller',
  Customer = 'Customer',
  Driver = 'Driver',
  Carrier = 'Carrier'
}

export enum Status {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended'
}

// Định nghĩa interface cho User Document
interface IUser extends Document {
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: Role;
  avatar: string;
  status: Status;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

// Định nghĩa Mongoose Schema cho User
const UserSchema: Schema = new Schema(
  {
    full_name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, maxlength: 100 },
    phone: { type: String, unique: true, maxlength: 20, required: false },
    password_hash: { type: String, required: true, maxlength: 255 },
    role: { 
      type: String, 
      enum: Object.values(Role), 
      default: Role.Customer, 
      required: true 
    },
    avatar: { type: String, required: false },
    status: { 
      type: String, 
      enum: Object.values(Status), 
      default: Status.Active, 
      required: true 
    },
    created_by: { type: Number, required: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Tạo Model từ Schema
const User = mongoose.model<IUser>('User', UserSchema);

export default User;
