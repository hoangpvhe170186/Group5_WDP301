import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export const requireAuth = async (req: any, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    // ✅ Giải mã token
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    // 👉 Một số token có thể là payload._id, payload.id hoặc payload.userId
    const uid = payload._id || payload.id || payload.userId;
    if (!uid) {
      console.warn("⚠️ Token payload không có userId / _id / id:", payload);
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // ✅ Lấy user từ DB
    const user = await User.findById(uid);
    if (!user) {
      console.warn("⚠️ Không tìm thấy user:", uid);
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Gán vào req.user để các route khác (Carrier / Seller / Customer) đều dùng được
    req.user = {
      _id: user._id.toString(),
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err: any) {
    console.error("❌ JWT verify error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};
