import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export const requireAuth = async (req: any, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const uid = user._id.toString();
    // 👉 cung cấp cả _id lẫn id để các file khác dùng kiểu nào cũng được
    req.user = { _id: uid, id: uid, role: user.role };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};


